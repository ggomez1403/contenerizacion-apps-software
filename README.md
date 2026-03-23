# Video Games Sales - Firebase Serverless App

Aplicacion web serverless que integra un dataset de ventas de videojuegos con Firebase Firestore, permitiendo buscar, filtrar y visualizar los datos.

## Arquitectura

```
Dataset CSV (Kaggle) → Script Node.js → Firebase Firestore → App Web React
```

## Tecnologias

- **Base de datos:** Firebase Cloud Firestore (NoSQL serverless)
- **Script de carga:** Node.js + Firebase Admin SDK
- **App web:** React + Chart.js
- **Dataset:** Video Games Sales (18,832 registros)

## Estructura del proyecto

```
├── Video_Games_Sales_Cleaned.csv    # Dataset original
├── upload-script/
│   ├── package.json                 # Dependencias del script
│   ├── upload.js                    # Script de carga a Firestore
│   └── serviceAccountKey.json       # Credenciales Firebase (no incluido)
├── web-app-react/
│   ├── .env                         # Variables de entorno Firebase (no incluido)
│   └── src/
│       ├── firebase.js              # Conexion a Firestore
│       ├── App.js                   # Componente principal
│       ├── App.css                  # Estilos
│       └── index.js                 # Punto de entrada
└── diagrama.html                    # Diagrama de arquitectura
```

## Configuracion

### 1. Crear proyecto en Firebase

- Ir a [Firebase Console](https://console.firebase.google.com/)
- Crear un proyecto nuevo
- Activar Cloud Firestore en modo de prueba
- Registrar una app web y obtener la configuracion

### 2. Configurar credenciales

**Script de carga** - Descargar la clave privada del service account desde Firebase Console > Cuentas de servicio > Generar nueva clave privada, y guardarla como:

```
upload-script/serviceAccountKey.json
```

**App web** - Crear el archivo `web-app-react/.env` con las variables de entorno:

```
REACT_APP_FIREBASE_API_KEY=tu_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=tu_proyecto
REACT_APP_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
REACT_APP_FIREBASE_APP_ID=tu_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=tu_measurement_id
```

### 3. Cargar datos a Firestore

```bash
cd upload-script
npm install
npm run upload
```

### 4. Ejecutar la app web

```bash
cd web-app-react
npm install
npm start
```

La app se abre en `http://localhost:3000`.

## Funcionalidades

- Busqueda por ID del registro
- Busqueda por titulo del videojuego
- Filtro por genero
- Tarjetas con estadisticas generales
- Grafica de dona (ventas por genero)
- Grafica de barras (top 10 mas vendidos)
- Tabla paginada con todos los registros
