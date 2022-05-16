

export default function Home({session}) {
    return (
    <>
        <p>{session}</p>
    </>
  )
}

// Gets the users session
export async function getServerSideProps(ctx) {
    return {
        props: {
            session: ctx.params.league
        },
    }
}