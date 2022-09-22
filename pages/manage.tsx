import Layout from "../components/Layout";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";

import { useAccount, useContractRead, useSignMessage, useNetwork } from "wagmi";

import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getSession } from "next-auth/react";
import { getToken } from "next-auth/jwt";

import { BigNumber } from "@ethersproject/bignumber";
import serialize from "form-serialize";

import { prisma } from "../components/db";
import { getContentByLabel } from "../utils";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  const token = await getToken({ req: context.req });

  const address = token?.sub ?? null;

  // Fetch the site content
  const siteContent = await prisma.content.findMany({
    select: {
      label: true,
      value: true,
    },
  });

  if (!address) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  // Fetch the user address
  const getContact: { email: string; isSubscribed: boolean } | null =
    await prisma.contact.findUnique({
      where: {
        address: address,
      },
      select: {
        email: true,
        isSubscribed: true,
      },
    });

  return {
    props: {
      address,
      session,
      profile: getContact,
      siteContent,
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

export default function Manage({
  address,
  profile,
  siteContent,
}: AuthenticatedPageProps) {
  const router = useRouter();
  const { status } = useSession();
  const { address: injectedAddress } = useAccount();
  const { chain } = useNetwork();

  const [isIncorrectChain, setIsIncorrectChain] = useState<boolean>(false);

  const [hasCheckedTokens, setHasCheckedTokens] = useState<boolean>(false);
  const [tokensOwned, setTokensOwned] = useState<number>(0);

  const [message, setMessage] = useState<string>("");
  const [signedMessage, setSignedMessage] = useState<string>("");

  const [apiResponseMsg, setApiResponseMsg] = useState<string>("");

  useContractRead({
    addressOrName:
      process.env.NEXT_PUBLIC_EVM_NFT_CONTRACT_ADDRESS ??
      `0x0000000000000000000000000000000000000000`,
    contractInterface: [
      {
        inputs: [{ internalType: "address", name: "owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "balanceOf",
    args: address,
    chainId: parseInt(process.env.NEXT_PUBLIC_EVM_CHAIN_ID ?? "1"),
    onSuccess(res) {
      setTokensOwned(BigNumber.from(res).toNumber());
      setHasCheckedTokens(true);
    },
  });

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

    // User is not on the correct chain
    const correctChainId = process.env.NEXT_PUBLIC_EVM_CHAIN_ID ?? "1";
    if (chain?.id !== parseInt(correctChainId)) {
      setIsIncorrectChain(true);
    } else {
      setIsIncorrectChain(false);
    }
  }, [chain]);

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
    if (!hasCheckedTokens) {
      return <>Just one sec...</>;
    }

    if (tokensOwned === 0) {
      return (
        <p>
          😭 You cannot join this mailing list as you do not own the relevant
          NFT!
        </p>
      );
    }

    const correctChainId = process.env.NEXT_PUBLIC_EVM_CHAIN_ID ?? 1;
    if (isIncorrectChain) {
      return <p>😭 Please change chain to id {correctChainId}</p>;
    }

    return (
      <>
        <form
          onSubmit={(e) => {
            handleForm(e);
          }}
        >
          <input
            type="email"
            name="email"
            size={30}
            required
            placeholder={`Email Address`}
            defaultValue={(profile && profile.email) ?? ""}
          ></input>
          <button>Save</button>
        </form>
        {apiResponseMsg}
      </>
    );
  };

  return (
    <Layout
      title={`Manage Subscription`}
      showConnectButton={true}
      showAdminLink={true}
      siteBanner={getContentByLabel(`SITE_BANNER`, siteContent)}
    >
      {showManageView()}
    </Layout>
  );
}
