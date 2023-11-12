"use client";
import React, { useState, useEffect } from "react";
import {
  auth,
  db,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  signOut,
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "../../lib/firebase-config";
import Link from "next/link.js";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [moods, setMoods] = useState([
    "Feliz 😄",
    "Triste 😭",
    "Emocionado 😱",
    "Enojado 😡",
    "Cansado 🥱",
  ]); // Lista de estados de ánimo
  const [logout, setLogout] = useState(false);
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUser(user.email || "Anonimo");
    } else {
      setCurrentUser("Anonimo");
    }

    obtenerDatos();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser("Anonimo");
      setLogout(true);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const obtenerDatos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "publicaciones"));
      const postsArray = [];

      querySnapshot.forEach((doc) => {
        const postData = doc.data();
        const post = {
          id: doc.id,
          username: postData.usuario,
          text: postData.publicacion,
          reactions: postData.reacciones,
          estadoAnimo: postData.estadoAnimo,
          imagen: postData.imagen,
        };
        postsArray.push(post);
      });

      setPosts(postsArray);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleCreatePost = async () => {
    if (newPost.trim() !== "") {
      setIsLoading(true); // Activa la carga

      const newUsername = currentUser;

      try {
        // Subir la imagen primero si hay una seleccionada
        let imageUrl = null;
        if (selectedImage) {
          const storageRef = ref(storage, "images/" + selectedImage.name);
          await uploadBytes(storageRef, selectedImage);

          // Obtén la URL de descarga de la imagen
          imageUrl = await getDownloadURL(storageRef);
          console.log("URL de la imagen subida:", imageUrl);
        }

        // Agregar la nueva publicación a la colección "publicaciones"
        const docRef = await addDoc(collection(db, "publicaciones"), {
          usuario: newUsername,
          publicacion: newPost,
          reacciones: {}, // Inicialmente, las reacciones están vacías
          estadoAnimo: selectedMood,
          imagen: imageUrl, // Agregar la URL de la imagen a la publicación
        });

        // Obtener el ID del documento recién creado (opcional, pero útil)
        console.log("Document written with ID: ", docRef.id);

        // Actualizar la lista de publicaciones local
        setPosts([
          ...posts,
          {
            username: newUsername,
            text: newPost,
            reactions: {},
            imagen: imageUrl,
          },
        ]);

        // Limpiar el campo de texto y la imagen seleccionada
        setNewPost("");
        setSelectedImage(null);

        obtenerDatos();
        setIsLoading(false);
      } catch (error) {
        console.error("Error adding document: ", error);
        setIsLoading(false);
      }
    }
  };

  const handleReactToPost = async (index, reactionType) => {
    const updatedPosts = [...posts];
    const post = updatedPosts[index];

    if (!post.reactions[reactionType]) {
      post.reactions[reactionType] = 1;
    } else {
      post.reactions[reactionType]++;
    }

    setPosts(updatedPosts);
    try {
      // Actualizar el documento en Firestore con las nuevas reacciones
      console.log(post.id);
      const postDocRef = doc(db, "publicaciones", post.id); // Asumiendo que "id" es el campo que almacena el ID del documento en Firestore
      await updateDoc(postDocRef, {
        reacciones: post.reactions,
      });

      // Notificar que el documento se ha actualizado en Firestore (opcional)
      console.log("Document updated in Firestore.");
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="bg-white p-4 text-black shadow-md shadow-gray-300">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <img
              src="/images/renombrar.jpeg"
              className="w-16 h-16 rounded-md"
              alt="Imagen de ejemplo"
            />
            <h1 className="text-2xl font-semibold ml-5">Think?</h1>
          </div>

          <div className="space-x-4">
            {currentUser !== "Anonimo" && logout !== true ? (
              <>
                <span>Bienvenido, {currentUser}</span>
                <button
                  onClick={handleLogout}
                  className="cursor-pointer underline"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="cursor-pointer underline">
                  Iniciar Sesión
                </Link>
                <Link href="/registro" className="cursor-pointer underline">
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="container mx-auto p-4 mt-10">
        <h1 className="text-2xl font-semibold mb-4">Página de Inicio</h1>
        <div className="mb-4">
          <textarea
            className="w-full p-2 border rounded"
            placeholder="Escribe tu nueva publicación..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
          ></textarea>
        </div>
        {/* Subir imagen */}
        <div className="mb-4 flex items-center">
          <h3 className="mr-2">Sube una imagen</h3>
          <input
            type="file"
            onChange={(e) => setSelectedImage(e.target.files[0])}
          />
        </div>
        <div className="mb-4">
          <select
            value={selectedMood}
            onChange={(e) => setSelectedMood(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Selecciona tu estado de ánimo</option>
            {moods.map((mood) => (
              <option key={mood} value={mood}>
                {mood}
              </option>
            ))}
          </select>
        </div>
        <button
          className="bg-blue-500 text-white py-2 px-4 rounded hover-bg-blue-600"
          onClick={handleCreatePost}
          disabled={isLoading}
        >
          {isLoading ? "Cargando..." : "Publicar"}
        </button>

        <div>
          <h3 className="mt-10">Publicaciones ({posts.length})</h3>
          {posts.map((post, index) => (
            <div key={index} className="bg-white rounded p-4 mb-4 mt-3">
              <div className="font-semibold mb-2 flex flex items-center">
                <img
                  src="https://icons.veryicon.com/png/o/miscellaneous/two-color-icon-library/user-286.png"
                  className="w-10 h-10"
                ></img>
                &nbsp;
                {post.username}
                <div className="font-light">
                  <div className="font-light">
                    {post.estadoAnimo
                      ? `\u00A0se siente ${post.estadoAnimo}`
                      : ""}
                  </div>
                </div>
              </div>
              {post.text}
              <img src={post.imagen} className="w-64 rounded mt-3 mb-4" />
              <div className="mt-2">
                <button
                  onClick={() => handleReactToPost(index, "like")}
                  className="mr-2"
                >
                  👍 ({post.reactions["like"] || 0})
                </button>
                <button
                  onClick={() => handleReactToPost(index, "love")}
                  className="mr-2"
                >
                  ❤️ ({post.reactions["love"] || 0})
                </button>
                <button
                  onClick={() => handleReactToPost(index, "wow")}
                  className="mr-2"
                >
                  😲 ({post.reactions["wow"] || 0})
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
