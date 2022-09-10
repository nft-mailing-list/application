import Layout from "./components/Layout"

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getSession } from "next-auth/react";
import { getToken } from "next-auth/jwt";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  const token = await getToken({ req: context.req });

  const address = token?.sub ?? null;

  if(!address) {
    return {
        props: {}
    }
  }

  return {
    props: {
      address,
      session,
      token,
    },
  };
};

export default function Index() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    // User verified account ownership, show them the manage view
    if(status === "authenticated") {
      void router.push("/manage");
    }
  });

  return(
    <Layout title={`Join the NFT mailing list!`} showNavigation={false}>
        By joining the mailing list you can receive updates from your favourite NFT minters via email.
    </Layout>
  )
}