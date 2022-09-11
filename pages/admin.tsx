import Layout from "./components/Layout";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";

import { useAccount, useContractRead, useSignMessage } from "wagmi";

import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getSession } from "next-auth/react";
import { getToken } from "next-auth/jwt";

import { BigNumber } from "@ethersproject/bignumber";
import serialize from "form-serialize";

import { PrismaClient } from "@prisma/client";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const prisma = new PrismaClient();

  const session = await getSession(context);
  const token = await getToken({ req: context.req });

  const address = token?.sub ?? null;

  // See if the address is the admin address
  let isAdmin = false;
  if (address) {
    const adminAddress =
      process.env.NEXT_PUBLIC_ADMIN_ADDRESS ??
      `0x0000000000000000000000000000000000000000`;
    isAdmin = address.toLowerCase() === adminAddress.toLowerCase();
  }

  if (!address || !isAdmin) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  // Get generalised stats
  const activeSubscribedNfts = await prisma.contact.aggregate({
    where: {
      isSubscribed: true,
    },
    _sum: {
      nftsOwned: true,
    },
  });
  const allSubscribeNfts = await prisma.contact.aggregate({
    _sum: {
      nftsOwned: true,
    },
  });

  const stats = [
    {
      value: activeSubscribedNfts._sum.nftsOwned,
      label: `Count of NFTs with active subscription in mailing list`,
    },
    {
      value: allSubscribeNfts._sum.nftsOwned,
      label: `Count of NFTs in mailing list`,
    },
  ];

  const allContacts = await prisma.contact.findMany({
    where: {
      isSubscribed: true,
    },
    select: {
      email: true,
    },
  });

  return {
    props: {
      address,
      session,
      stats,
      allContacts,
    },
  };
};

type AuthenticatedPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>;

async function saveProfile(payload: any) {
  const response = await fetch("/api/subscribe", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return await response.json();
}

export default function Admin({
  address,
  stats,
  allContacts,
}: AuthenticatedPageProps) {
  const router = useRouter();
  const { status } = useSession();
  const { address: injectedAddress } = useAccount();

  const [message, setMessage] = useState<string>("");
  const [signedMessage, setSignedMessage] = useState<string>("");

  const [apiResponseMsg, setApiResponseMsg] = useState<string>("");

  console.log(allContacts);

  const { data, isError, isLoading, isSuccess, signMessage } = useSignMessage({
    message,
    onSettled(data, error) {
      setSignedMessage(message);
      setMessage("");
    },
  });

  useEffect(() => {
    // User is not authenticated, redirect back home
    if (status !== "authenticated") {
      console.log(`User is not authenticated!`);
      void router.push("/");
    }

    // User switched their address, kill their previous session
    if (injectedAddress?.toLowerCase() !== address.toLowerCase()) {
      console.log(`User switched accounts, kill old session`);
      signOut();
    }
  });

  useEffect(() => {
    if (message !== "" || signedMessage !== message) {
      signMessage();
    }

    if (isSuccess) {
      const payload = {
        data: signedMessage,
        proof: data,
        address: address,
      };

      // Now save the address
      const didProfileSave = async () => {
        const res = await saveProfile(payload);
        return res;
      };

      didProfileSave()
        .then((resp) => setApiResponseMsg(resp.message))
        .catch((resp) => setApiResponseMsg(resp.message));
    }
  }, [message, isSuccess]);

  const handleForm = (e: any) => {
    e.preventDefault();
    const messageToSign = serialize(e.target, { hash: true });
    setMessage(JSON.stringify(messageToSign));
  };

  const showManageView = () => {
    return (
      <>
        <form
          onSubmit={(e) => {
            handleForm(e);
          }}
        >
            Coming soon
          <button>Save</button>
        </form>
        {apiResponseMsg}
      </>
    );
  };

  const showGeneralStats = () => {
    return (
      <ul>
        {stats.map((stat: any) => {
          return (
            <li>
              <strong>{stat.label}:</strong> {stat.value ?? 0}
            </li>
          );
        })}
      </ul>
    );
  };

  const showMailingList = () => {
    return (
      <textarea cols={50} rows={20} defaultValue={allContacts.map(({ email }: any) => email).join("\r\n")}>
      </textarea>
    );
  };

  return (
    <Layout title={`Admin`} showAdminLink={true}>
      <h3>Stats</h3>
      {showGeneralStats()}

      <h3>Mailing List</h3>
      <p>Total Active Mail Subscriptions: {allContacts.length}</p>
      {showMailingList()}

      <h3>Edit Settings</h3>
      {showManageView()}
    </Layout>
  );
}
