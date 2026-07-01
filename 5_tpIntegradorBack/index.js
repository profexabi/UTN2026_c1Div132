/////////////////////
// Importaciones
import express from "express";
const app = express();
import environments from "./src/api/config/environments.js";
import {
  authRoutes,
  productRoutes,
  viewRoutes,
} from "./src/api/routes/index.js";
import cors from "cors";
import {
  loggerURL,
  middlewareSimpatico,
} from "./src/api/middlewares/middlewares.js";
import { join, __dirname } from "./src/api/utils/index.js"; // Importamos la configuracion para trabajar con rutas de /utils
import session from "express-session";
import { connectDatabase } from "./src/api/database/sequelize.js";

/////////////////////
// Config

// Estraemos con el destructuring las variables port y session_key
const { port, session_key } = environments;
const PORT = port;

/////////////////////
// Middlewares
app.use(cors()); // Middleware basico para permitir todas las solicitudes

// Middleware para parsear JSON en las solicitudes POST y PUT con el envio fetch
app.use(express.json()); // sin esto, recibe como undefined

// Middleware para parsear informacion enviada de forma nativa con <form>
app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(loggerURL);

app.use(middlewareSimpatico);

app.use(express.static(join(__dirname, "src/public"))); // Middleware para servir archivos estaticos
// Gracias a esta configuracion, ya puedo acceder a http://localhost:3000/css/styles.css -> y obtener el archivo css que se encuentra en la ruta "src/public/css/styles.css"

// Configuramos EJS como motor de plantillas
app.set("view engine", "ejs"); // Motor de vistas
app.set("views", join(__dirname, "src/views")); // Desde la raiz del servidor apuntamos a / + /src + /views

/* ===========================
    Trabajando con sesiones
==============================

El protocolo HTTP es un protocolo "stateless", es decir sin estado. No recuerda quien somos entre peticiones, cada peticion la interpreta como una nueva peticion

El middleware express-session permite que express recuerde datos entre peticiones. Porque sin sesiones no hay forma de saber si el usuario está logueardo, a menos que usemos tokens (JWT), cookies firmadas o mecanismos como express-session

---

Gracias a express-session, cuando iniciemos sesion exitosamente

1. Guardara algo como
    req.session.user = { id: 12, name: "Mauro" }


2. Gracias a esta sesion iniciada, podremos acceder a las rutas.

3. La manera de proteger las rutas (evitar que un usuario no logueado acceda a nuestro panel de administracion -> dashboard), para proximas request, necesitaremos comprobar que si no hay una sesion iniciada, redirigir a login

    if (!req.session.user) {
        return res.redirect("/login");
    }

4. Para evitar escribir esto en cada controlador, lo delegamos en un middleware de ruta (que nos permitir'a no repetir este codigo)

    // Middleware simple de proteccion de rutas
    const requireLogin = (req, res, next) => {

        // Un login exitoso crea una sesion -> comprobar si existe esa sesion

        // Si no existe sesion redirigimos a la pantalla de login
        if (!req.session.user) {
            return res.redirect("/login");
        }

        next();
    }

5. Cuando creamos una sesion, tenemos que crear una contraseña, esto servira que no se puedan:

    - Falsificar una sesion
    - Modificar una sesion
    - Robar una identidad

Para esto creamos una contraseña, por ejemplo con
    https://secretkeygen.vercel.app/



6. Guardamos esta contraseña en el .env, la leemos en el environments.js, y la exportamos para usarla ahora acá. 

Guardamos esta clave en el .env para que no este expuesta en el repo y para que nadie la robe y falsifique sesiones


=========================================
    Entendiendo el codigo de abajo
=========================================

app.use(session({})) 

    app.use() es un middleware que se ejecuta en todas las rutas de la aplicacion

    Aca estamos aplicando el middleware express-session a la aplicacion. Esto significa que cada vez que un usuario hace una solicitud HTTP, se gestionará su sesión mediante el middleware


secret: session_key

    secret es clave porque se usa para firmar la sesion, asegurando que los datos de la sesion no sean modificados por el cliente. Es fundamental para la seguridad dela aplicacion

    Sin el secreet, la sesion seria vulnerable a ataques de modificacion de datos. Por eso el valor de session_key debe ser una cadena de caracters aleatoria y secreta (nunca algo predecible)

    Este valor se usa para firmar las cookies de sesion, de manera que el servidor pueda verificar que los datos no fueron alterados por el cliente


resave: false

    Determina si la sesion debe guardarse de nuevo en el almacenamiento de la sesion cada vez que se realice una solicitud

    Si establece en false, solo se guarda la sesion si hubo algun cambio en los datos de la sesion

    Si se establece en true, la sesion se guarda de nuevo en cada solicitud, incluso si no hubo cambio. Esto generaria un gasto innecesario de recursos, por eso es mejor establecerla en false


saveUnitialized: true

    Controla si las sesiones no inicializadas (sesiones que no tienen datos) se deben guardar

    Si se establece en true, se guarda la sesion incluso si no tiene datos (por ejempleo en el caso de un usuario recien llegado)

    Si se establece en false, las sesiones vacias no se almacenan. Esto podria ser util para evitar el almacenamiento innecesario de sesiones para usuarios que no interactuan con la aplicacion de manera significativa

    Por lo general, se recomienda establecerlo en true para garantizar que la sesion se cree desde el inicio, ya que muchos sistemas requieren que haya un identificar de sesion presente aunque este vacio
*/

app.use(
  session({
    secret: session_key, // Firma las cookies para evitar manipulacion (debe ser una contraseña segura)
    resave: false, // Evita guardar la sesion si no hubo cambios
    saveUnitialized: true, // No guarda sesiones vacias
  }),
);

/////////////////////
// Endpoints
app.get("/", (req, res) => {
  res.send("Hola mundo");
});

//////////
// Rutas
app.use("/api/products", productRoutes); // Rutas de producto
app.use("/dashboard", viewRoutes); // Rutas de vista
app.use("/login", authRoutes); // Rutas de autenticacion

// app.use("/api/users", userRoutes);

await connectDatabase();

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
