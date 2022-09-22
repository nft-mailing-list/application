import Layout from "../components/Layout";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getSession } from "next-auth/react";
import { getToken } from "next-auth/jwt";

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
      props: {
        siteContent,
      },
    };
  }

  return {
    props: {
      address,
      session,
      token,
      siteContent,
    },
  };
};

type IProps = InferGetServerSidePropsType<typeof getServerSideProps>;

export default function Index({ siteContent }: IProps) {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    // User verified account ownership, show them the manage view
    if (status === "authenticated") {
      void router.push("/manage");
    }
  });

  if (siteContent === undefined) {
    // The admin of the site has not seeded the database yet
    return (
      <Layout
        title={`Finish setting up the system`}
        showConnectButton={false}
        showAdminLink={false}
      >
        We need to seed the database with <code>npm run prisma:seed</code>.{" "}
        <a
          href="https://github.com/nft-mailing-list/application/wiki/Configuration#seed-the-database-with-content"
          target="_blank"
        >
          Check the wiki
        </a>{" "}
        for help!
      </Layout>
    );
  }

  return (
    <Layout
      title={getContentByLabel(`SITE_INTRO`, siteContent)}
      showConnectButton={true}
      showAdminLink={false}
      siteBanner={getContentByLabel(`SITE_BANNER`, siteContent)}
    >
      {getContentByLabel(`SITE_HOOK`, siteContent)}
    </Layout>
  );
}
