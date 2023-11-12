import { NextResponse } from "next/server";

export async function middleware(request, response) {
  const session = request.cookies.get(process.env.COOKIE_SESSION_NAME);

  //Regresar a /login si no hay cookie de sesion
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  //Llamar a la API para validar el token
  const responseAPI = await fetch(`${request.nextUrl.origin}/api/auth`, {
    headers: {
      Cookie: `${process.env.COOKIE_SESSION_NAME}=${session?.value}`,
    },
  });

  //Regresar a /login si la validacion falla
  if (responseAPI.status !== 200) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

//Nuestras rutas protegidas
export const config = {
  matcher: ["/", "/mi-ruta-protegida/:path*"],
};
