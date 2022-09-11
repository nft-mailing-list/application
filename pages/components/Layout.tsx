import { ConnectButton } from "@rainbow-me/rainbowkit";
import Head from "next/head";
import React from "react";
import styles from "../../styles/Layout.module.css";
import Link from "next/link";

export default function Layout({
  title,
  showAdminLink,
  children,
}: {
  title: string;
  showAdminLink: boolean;
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
        <h1>{title}</h1>

        <ConnectButton />

        <div className={styles.children}>
            {children}
        </div>
      </main>

      <footer className={styles.footer}>
        <p>NFT Mailing List</p>
        {showAdminLink && <Link href="/admin"><a id={styles.adminLink}>⚙️</a></Link>}
      </footer>
    </div>
  );
}
