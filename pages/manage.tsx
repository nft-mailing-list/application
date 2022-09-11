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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  const token = await getToken({ req: context.req });

  const address = token?.sub ?? null;

  if (!address) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      address,
      session,
    },
  };
};

type AuthenticatedPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>;

export default function Manage({ address }: AuthenticatedPageProps) {
  const router = useRouter();
  const { status } = useSession();
  const { address: injectedAddress } = useAccount();

  const [hasCheckedTokens, setHasCheckedTokens] = useState<boolean>(false);
  const [tokensOwned, setTokensOwned] = useState<number>(0);

  const [message, setMessage] = useState<string>("");
  const [signedMessage, setSignedMessage] = useState<string>("");

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
    onSuccess(data) {
        // Reset the message to send
        setSignedMessage(message);
        setMessage('')
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
    if(message !== "") {
        signMessage();
    }

    if(isSuccess) {
        console.log(data, signMessage, signedMessage);
        const signedProof = {
            data: signedMessage,
            proof: data,
            address: address,
        };
    
        console.log(signedProof);
    }
  }, [message, isSuccess])

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

    return (
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
        ></input>
        <button>{isSuccess ? `Save` : `Sign`}</button>
      </form>
    );
  };

  return (
    <Layout title={`Manage Subscription`} showNavigation={true}>
      {showManageView()}
    </Layout>
  );
}
