import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Rupeeflow</title>
        <meta name="description" content="Welcome to Rupeeflow!" />
      </Head>
      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <h1>Welcome to Rupeeflow</h1>
        <p>Your application is running successfully!</p>
      </main>
    </>
  );
}
