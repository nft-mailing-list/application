import { ConnectButton } from "@rainbow-me/rainbowkit";
import Head from "next/head";
import React from "react";
import styles from "../styles/Layout.module.css";
import Link from "next/link";

export default function Layout({
  title,
  showAdminLink,
  showConnectButton,
  siteBanner,
  children,
}: {
  title: string;
  showAdminLink: boolean;
  showConnectButton?: boolean;
  siteBanner?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      <Head>
        <title>Mailing List</title>
        <meta
          name="description"
          content="A mailing list - get emails if you hold an NFT."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <img src={siteBanner} title={`${title} Banner`} />

        <h1>{title}</h1>

        {showConnectButton && <ConnectButton />}

        <div className={styles.children}>
            {children}
        </div>
      </main>

      <footer className={styles.footer}>
        <p>
          <a href="https://github.com/nft-mailing-list/application/wiki" target="_blank">NFT Mailing List</a>
        </p>
        {showAdminLink && <Link href="/admin"><a id={styles.adminLink}>⚙️</a></Link>}
      </footer>
    </div>
  );
}
