import Layout from "../components/Layout";
import Email from "../components/Email";

import styles from "../styles/Admin.module.css";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";

import ReactTooltip from 'react-tooltip';

import { useAccount, useSignMessage } from "wagmi";

import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getSession } from "next-auth/react";
import { getToken } from "next-auth/jwt";

import serialize from "form-serialize";

import { prisma } from '../components/db'

export const getServerSideProps: GetServerSideProps = async (context) => {
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
  const countActiveSubscribersNfts = await prisma.contact.aggregate({
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
  const countActiveSubscribers = await prisma.contact.aggregate({
    where: {
      isSubscribed: true
    },
    _count: {
      id: true
    }
  });

  console.log(`actives`, countActiveSubscribers)

  const allContacts = await prisma.contact.findMany({
    where: {
      isSubscribed: true,
    },
    select: {
      email: true,
    },
  });

  const stats = [
    {
      value: countActiveSubscribersNfts._sum.nftsOwned,
      label: `NFT Ownership w/ Active Subscriptions`,
      moreInfo: `The number of NFTs owned by active subscribers. A subscriber can hold more than 1 NFT.`
    },
    {
      value: allSubscribeNfts._sum.nftsOwned,
      label: `NFT Ownership in Mailing List`,
      moreInfo: `The total amount of NFTs owned by all subscribers - even those with an inactive subscription.`
    },
    {
      value: allContacts.length,
      label: `Total Subscribers`,
      moreInfo: `The total count of all active and inactive subscribers.`
    },
    {
      value: countActiveSubscribers._count.id,
      label: `Active Subscribers`,
      moreInfo: `The total count of active subscribers.`
    }
  ];



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

async function saveSettings(payload: any) {
  const response = await fetch("/api/settings", {
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

  const [tooltip, showTooltip] = useState<boolean>(true);

  const { data, isError, isLoading, isSuccess, signMessage } = useSignMessage({
    message,
    onSettled(data, error) {
      setSignedMessage(message);
      setMessage("");
    },
  });

  useEffect(() => {
    ReactTooltip.rebuild();
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
      const didSettingsSave = async () => {
        const res = await saveSettings(payload);
        return res;
      };

      didSettingsSave()
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
      <ul id={styles.stats}>
        {stats.map((stat: any, key: any) => {
          return (
            <li key={stat.label} data-tip={stat.moreInfo} onMouseEnter={() => showTooltip(true)}
            onMouseLeave={() => {
              showTooltip(false);
              setTimeout(() => showTooltip(true), 50);
            }}>
              <label>{stat.label}:</label> 
              {stat.value ?? 0}
            </li>
          );
        })}
      </ul>
    );
  };

  const showMailingList = () => {
    return (
      <textarea
        cols={50}
        rows={20}
        defaultValue={allContacts.map(({ email }: any) => email).join("\r\n")}
      ></textarea>
    );
  };

  return (
    <Layout title={`Admin`} showAdminLink={true}>
      {tooltip && <ReactTooltip effect="float" backgroundColor={`#000`} textColor={`#FFF`} afterHide={(evt) => console.log(`Hiding`)} />}

      <h3>Stats</h3>
      {showGeneralStats()}

      <h3>Mailing List</h3>
      {showMailingList()}

      <h3>Edit Settings</h3>
      {showManageView()}

      <h3>Send email (via Mailgun)</h3>
      <div className="editor-container">
        <Email />
      </div>
    </Layout>
  );
}
