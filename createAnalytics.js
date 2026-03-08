import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

async function createAnalyticsDocs() {

  const usersSnapshot = await getDocs(collection(db, "users"));

  usersSnapshot.forEach(async (userDoc) => {

    const userData = userDoc.data();

    await setDoc(doc(db, "analytics", userDoc.id), {
      artistName: userData.artistName || "",
      email: userData.email || "",

      totalStreams: 0,
      totalReleases: 0,

      spotifyStreams: 0,
      appleStreams: 0,
      youtubeStreams: 0
    });

  });

  console.log("Analytics created for all users");

}

createAnalyticsDocs();
