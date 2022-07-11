import { useEffect, useState } from "react";

// Simply just shows the name of the user given there id
export default function Username({ id }) {
  const [username, setUsername] = useState("");
  useEffect(() => {
    fetch(`/api/user/${id}`).then(async (val) => {
      const newUsername = await val.json();
      setUsername(newUsername);
    });
  }, [id]);
  return <>{username}</>;
}
