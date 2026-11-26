# App de torneos de tenis: guía de instalación

Al terminar tendrás dos links:

| Link | Para quién | Qué hace |
|---|---|---|
| `https://cct26.github.io/torneo-tenis/` | Jugadores y público | Ver partidos, grupos, llaves y convocatoria. No pide cuenta y se actualiza solo. |
| `https://cct26.github.io/torneo-tenis/admin.html` | Organizadores | Entrar con usuario y contraseña para capturar resultados, reprogramar partidos, editar jugadores y grupos, e importar Excel. |

Todo es gratis:
- **GitHub Pages** publica las páginas.
- **Supabase** guarda los datos y los usuarios.

Tiempo estimado: 30 a 40 minutos. Hazlo desde la computadora.

---

## Antes de empezar

1. Descarga `torneo-tenis.zip` y descomprímelo en una carpeta. Debe traer:
   - `index.html`, `admin.html`, `app.js`, `config.js`, `poster.jpg`
   - `schema.sql`, `seed.sql`, `README.md`
   - Una carpeta oculta `.github`. No te preocupes si no la ves; en el paso 5 se crea a mano.
2. Ten abierto el correo cct.torneos@gmail.com. GitHub y Supabase mandan códigos de verificación.
3. Ten a la mano un lugar seguro para anotar **tres contraseñas**:
   - La de GitHub.
   - La de la base de datos de Supabase.
   - La del usuario editor de la app.

---

## Paso 1. Crear la cuenta de GitHub

1. Entra a **github.com/signup**.
2. Escribe el correo, una contraseña y el **nombre de usuario**.
   - El usuario aparece en el link: `https://cct26.github.io/...`.
   - Que sea corto y claro, por ejemplo `ctc-tampico`. Si GitHub dice que está ocupado, prueba otro.
3. Resuelve la verificación y escribe el código que llega al correo.
4. Si pregunta por plan, elige **Free**. Las preguntas de "personalizar" se pueden saltar.

✅ **Anota el usuario que quedó:** __________________

---

## Paso 2. Crear el proyecto en Supabase

1. Entra a **supabase.com** → **Start your project** → **Continue with GitHub** y autoriza con la cuenta del paso 1.
2. Si pide crear una organización:
   - Nombre: `Club Campestre Tampico`.
   - Tipo: **Personal**.
   - Plan: **Free**.
3. **New project:**
   - **Name:** `torneo-tenis`
   - **Database Password:** dale **Generate a password** y **guárdala**. Casi nunca se usa, pero no se puede recuperar.
   - **Region:** `East US (North Virginia)`.
   - **Create new project**. Tarda 1 a 2 minutos en quedar listo.

---

## Paso 3. Crear la base de datos

1. En el menú izquierdo entra a **SQL Editor** → **New query**.
2. Abre `schema.sql` con el Bloc de notas, copia **todo** y pégalo en el editor. Dale **Run**.
   - Si aparece un aviso de "destructive operation", confirma con **Run this query**. Es normal: solo borra permisos viejos para crearlos de nuevo.
   - Debe decir **Success. No rows returned**.
3. **New query** otra vez. Copia y pega **todo** `seed.sql` y dale **Run**.
   - Esto carga el XXXI Challenger: singles varonil y femenil, con los resultados ya capturados.
4. Para revisar: menú **Table Editor** → tabla **docs**. Deben aparecer unas 22 filas.

---

## Paso 4. Crear el usuario que va a editar

**4.1 Cerrar los registros públicos.** Este paso es muy importante.
1. Menú **Authentication** → **Sign In / Providers**.
2. Apaga **Allow new users to sign up** y guarda.

Sin esto, cualquiera podría crearse una cuenta y editar el torneo.

**4.2 Crear tu usuario.**
1. Menú **Authentication** → **Users** → **Add user** → **Create new user**.
2. **Email:** `daniel@torneo.local`. Al entrar a la app basta con escribir `daniel`, porque la app agrega `@torneo.local` sola. También puedes usar un correo real.
3. **Password:** la contraseña con la que vas a entrar a editar.
4. Marca **Auto Confirm User** → **Create user**.

Repite este paso por cada persona que vaya a capturar. Por ejemplo, `israel@torneo.local`.

**4.3 Copiar los datos de conexión.**
1. Arriba en el proyecto toca **Connect**, o ve a **Project Settings → Data API / API Keys**.
2. Copia la **Project URL**. Se ve como `https://abcdefghijk.supabase.co`.
3. Copia la llave pública:
   - Si existe la pestaña **Legacy API Keys**, usa la **anon public** (empieza con `eyJ...`).
   - Si no, usa la **Publishable key** (empieza con `sb_publishable_...`).
   - **Nunca** uses la `service_role` ni la `secret`.
4. Abre `config.js` con el Bloc de notas y reemplaza los dos valores:

```js
window.TORNEO_CFG = {
  url: "https://abcdefghijk.supabase.co",
  anonKey: "eyJhbGciOi...la-llave-completa..."
};
```

Guarda el archivo.

---

## Paso 5. Subir la app a GitHub

**5.1 Crear el repositorio.**
1. En GitHub: botón **+** (arriba a la derecha) → **New repository**.
2. **Repository name:** `torneo-tenis`.
   - Si prefieres un link más corto (`https://cct26.github.io/` sin `/torneo-tenis`), nombra el repo exactamente `cct26.github.io`.
3. Selecciona **Public**. Es obligatorio para el hosting gratis.
4. **No** marques "Add a README" → **Create repository**.

**5.2 Subir los archivos.**
1. En el repo vacío toca el link **uploading an existing file**.
2. Arrastra estos 8 archivos (ya con `config.js` editado):
   - `index.html`, `admin.html`, `app.js`, `config.js`, `poster.jpg`
   - `schema.sql`, `seed.sql`, `README.md`
3. Abajo toca **Commit changes**.

**5.3 Crear la tarea que evita que Supabase se pause.**
El plan gratis de Supabase pausa el proyecto tras 7 días sin uso. Esta tarea lo consulta cada 3 días.
1. En el repo: **Add file** → **Create new file**.
2. En el nombre escribe exactamente `.github/workflows/mantener-activo.yml`. Al escribir las diagonales, GitHub crea las carpetas.
3. Pega el contenido del archivo `mantener-activo.yml` (viene en la carpeta `.github/workflows` del zip, o cópialo del final de esta guía).
4. **Commit changes**.

**5.4 Activar la página.**
1. En el repo: **Settings** → **Pages** (menú izquierdo).
2. **Source:** Deploy from a branch.
3. **Branch:** `main`, carpeta `/ (root)` → **Save**.
4. Espera 1 a 2 minutos y recarga. Arriba aparece *"Your site is live at …"* con tu link.

---

## Paso 6. Probar que todo funcione

1. **Link público** (`https://cct26.github.io/torneo-tenis/`):
   - Debe verse el torneo con los partidos.
   - No debe aparecer la pestaña "Organizar".
2. **Link de edición** (`…/admin.html`):
   - Pide usuario y contraseña. Entra con `daniel` y tu contraseña.
   - Debe aparecer la pestaña **Organizar** y el botón **Salir**.
3. **Prueba de captura:** abre un partido pendiente, captura un marcador y guarda. Luego abre el link público en otra pestaña o en el celular: el resultado debe aparecer solo, en segundos.
4. **Prueba de la tarea:** en GitHub, pestaña **Actions** → **Mantener Supabase activo** → **Run workflow**. Debe salir en verde. Si sale en rojo, revisa que `config.js` tenga la URL y la llave correctas.

---

## Uso diario

- **Capturar resultado:** en `admin.html`, toca el partido, escribe los juegos de cada set y **Guardar resultado**. El cursor avanza solo; si quedan 1 set a 1, aparece la casilla del match tie-break.
- **W.O.:** botón **W.O. gana …**. Se desmarca tocándolo otra vez.
  - Si fue default injustificado, marca la casilla: los demás partidos de grupo de ese jugador cuentan solos como W.O.
- **Lluvia o reprogramación:** en el partido, **Suspendido por lluvia** o **Por reprogramar**. Cuando tenga nueva fecha, **Cambiar fecha**.
- **Jugadores y grupos:**
  - Pestaña **Jugadores** (o **Parejas** en dobles) para agregar, editar o eliminar.
  - Botón **Editar** en cada grupo para cambiar integrantes.
- **Llaves:** se arman solas con los primeros de grupo. Cuando terminen los grupos, toca **Fijar llave**.
- **Dobles y otros torneos:** en **Organizar** → **Importar jugadores y cruces**.
  - Sube un Excel o CSV. Usa **Descargar plantilla** para ver el formato.
  - Ahí mismo se crea un torneo nuevo y se elige cuál ven todos.

---

## Agregar a otra persona que capture

En Supabase: **Authentication → Users → Add user → Create new user**. Por ejemplo, correo `israel@torneo.local` con su contraseña, y **Auto Confirm User** marcado. Esa persona entra a `admin.html` escribiendo `israel`.

Para quitarle el acceso, borra su usuario en la misma pantalla.

---

## Si algo falla

| Lo que ves | Qué revisar |
|---|---|
| "Falta configurar Supabase en config.js" | `config.js` sigue con `TU-PROYECTO` / `TU_ANON_KEY`. Edítalo en GitHub con el lápiz ✏️ y guarda. |
| "No se pudieron cargar los torneos" | Que la URL y la llave estén bien copiadas, sin espacios. Que `schema.sql` y `seed.sql` hayan corrido sin error. |
| La página carga pero sin partidos | Que `seed.sql` haya corrido. En **Table Editor → docs** debe haber filas. |
| "Usuario o contraseña incorrectos" | Que el usuario exista en **Authentication → Users** y tenga **Auto Confirm User**. Escribe solo `daniel`, sin `@torneo.local`, o el correo completo. |
| "No tienes permiso para editar" | La sesión expiró. Toca **Salir** y vuelve a entrar. |
| Error 404 en el link | Espera 2 minutos después de activar Pages. Revisa que **Settings → Pages** diga `main` / `(root)` y que el repo sea **Public**. |
| Supabase muestra el proyecto **Paused** | En el panel de Supabase, abre el proyecto → **Resume project**. Los datos no se pierden. |
| GitHub avisa que desactivó la tarea programada | Pasa tras 60 días sin cambios en el repo. Ve a **Actions** → **Mantener Supabase activo** → **Enable workflow**. |

---

## Cómo están guardados los datos (referencia técnica)

Una sola tabla, `docs`, con documentos JSON identificados por una ruta:

| Ruta | Contenido |
|---|---|
| `config/app` | Torneo que ven todos |
| `torneos/{id}` | Datos, convocatoria y póster del torneo |
| `torneos/{id}/cuadros/{SV, SF, DV, DF}` | Jugadores, grupos, partidos y llaves (Singles/Dobles × Varonil/Femenil) |
| `torneos/{id}/res/{cuadro}.{partido}` | Resultado de cada partido |

- **Lectura:** pública.
- **Escritura:** solo usuarios con sesión (políticas RLS en `schema.sql`).
- **Tiempo real:** la vista pública se actualiza sola por Supabase Realtime.
- **Pósters:** se guardan en el bucket público `publico` de Supabase Storage.

---

## Contenido de `.github/workflows/mantener-activo.yml`

```yaml
name: Mantener Supabase activo

# Consulta la base cada 3 días para que el plan gratis de Supabase no pause el proyecto.
# Toma la URL y la llave pública de config.js, así que no hay que configurar nada más.
on:
  schedule:
    - cron: "17 14 */3 * *"
  workflow_dispatch:

permissions:
  contents: read

jobs:
  consultar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Consultar la base
        run: |
          URL=$(grep -oE 'url:[[:space:]]*"[^"]+"' config.js | sed -E 's/.*"([^"]+)"/\1/')
          KEY=$(grep -oE 'anonKey:[[:space:]]*"[^"]+"' config.js | sed -E 's/.*"([^"]+)"/\1/')
          CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL/rest/v1/docs?select=path&limit=1" -H "apikey: $KEY")
          echo "Supabase respondió: $CODE"
          test "$CODE" = "200"
```
