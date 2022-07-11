import Menu from "../components/Menu";
export default function Home({ session }) {
  return (
    <>
      <Menu session={session} />
      <h1 className="center">404</h1>
    </>
  );
}
