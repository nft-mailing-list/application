import { ConnectButton } from "@rainbow-me/rainbowkit";
import Head from "next/head";
import React from "react";
import styles from "../../styles/Layout.module.css";

export default function Layout({
  title,
  showNavigation,
  children,
}: {
  title: string;
  showNavigation: boolean;
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

      <footer className={styles.footer}>NFT Mailing List</footer>
    </div>
  );
}
