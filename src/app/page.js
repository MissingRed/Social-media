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
} from "../lib/firebase-config";
import Link from "next/link.js";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const openModal = () => {
    setIsModalOpen(true);
  };

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
      <nav className="bg-[#3B82F6] p-4 text-white shadow-md shadow-gray-300">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <img
              src="/images/renombrar.jpeg"
              className="w-16 h-16 rounded-md"
              alt="Imagen de ejemplo"
            />
            <h1 className="text-2xl font-semibold ml-5">Think?</h1>
          </div>

          <div className="hidden lg:flex space-x-4">
            {/* Mostrar en pantallas grandes */}
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

          <div className="lg:hidden flex items-center">
            {/* Mostrar en pantallas pequeñas */}
            {currentUser !== "Anonimo" && logout !== true ? (
              ""
            ) : (
              <>
                <div className="flex flex-col">
                  <Link href="/login" className="cursor-pointer underline">
                    Iniciar Sesión
                  </Link>
                  <Link href="/registro" className="cursor-pointer underline">
                    Registrarse
                  </Link>
                </div>
              </>
            )}
            {currentUser !== "Anonimo" && logout !== true && (
              <button
                onClick={handleLogout}
                className="ml-4 cursor-pointer underline"
              >
                Cerrar Sesión
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="fixed bottom-0 w-full bg-blue-500 h-20 flex justify-between items-center p-10">
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="feather feather-home"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <div className="rounded-full bg-white w-10 h-10 flex justify-center items-center text-2xl">
          {!isPublishing ? (
            <div onClick={() => setIsPublishing(true)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="feather feather-plus-circle"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
          ) : (
            <div onClick={() => setIsPublishing(false)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="feather feather-x-circle"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
          )}
        </div>
        <div>
          <button onClick={openModal}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-user"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>
        </div>
      </div>
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-md flex flex-col	items-center">
            {/* Contenido del Modal */}
            <h2 className="text-2xl font-semibold mb-4">
              Información del Usuario
            </h2>
            <img
              src="https://icons.veryicon.com/png/o/miscellaneous/two-color-icon-library/user-286.png"
              className="w-10 h-10"
            ></img>
            <p>Correo electronico: {currentUser}</p>
            {/* Otros detalles del usuario */}
            <button
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mt-4"
              onClick={() => setIsModalOpen(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      {/* Contenido principal */}
      <div className="container mx-auto p-4 mt-10">
        <h1 className="text-2xl font-semibold mb-4">Página de Inicio</h1>
        {isPublishing ? (
          <div>
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
          </div>
        ) : (
          ""
        )}

        <div className="mb-20">
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
