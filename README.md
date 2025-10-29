# 🎓 EduScale - Plataforma SaaS White-Label para Gestión de Admisiones

## TPO - Ingeniería II | Persistencia Políglota

Plataforma educativa multi-tenant con arquitectura de persistencia políglota, diseñada para gestionar el Ciclo de Vida del Alumno (CVA) con alta disponibilidad y escalabilidad.

---

## 📋 Descripción del Proyecto

EduScale es una plataforma SaaS que permite a instituciones educativas gestionar el proceso completo de admisión e inscripción de estudiantes, desde la prospección inicial hasta el registro final. El sistema implementa **persistencia políglota** utilizando cuatro bases de datos NoSQL diferentes, cada una optimizada para casos de uso específicos.

---

## 🗄️ Bases de Datos Utilizadas

| Base de Datos | Tipo | Fase | Uso Principal |
|---------------|------|------|---------------|
| **Redis** | Clave-Valor | Fase A: Prospección | Validación rápida de duplicados, rate limiting, datos temporales |
| **MongoDB** | Documental | Fase B: Admisión | Expedientes flexibles con documentos y metadatos variables |
| **Cassandra** | Columnar | Fase C: Inscripción | Registros inmutables con alta escritura concurrente |
| **Neo4j** | Grafos | Relaciones | Análisis de redes y relaciones entre entidades |

---

## 🏗️ Arquitectura

```
EduScale-Full/
├── frontend/                 # Aplicación React
│   ├── public/
│   ├── src/
│   │   ├── components/      # Componentes de cada fase
│   │   ├── App.js
│   │   └── index.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── backend/                  # API Node.js
│   ├── src/
│   │   ├── config/          # Configuraciones de BD
│   │   │   ├── mongodb.js
│   │   │   ├── cassandra.js
│   │   │   ├── redis.js
│   │   │   └── neo4j.js
│   │   ├── routes/          # Endpoints de la API
│   │   │   ├── prospection.js
│   │   │   ├── admission.js
│   │   │   ├── enrollment.js
│   │   │   └── relations.js
│   │   └── index.js         # Servidor principal
│   ├── Dockerfile
│   └── package.json
│
└── docker-compose.yaml       # Orquestación de servicios
```

---

## 🚀 Requisitos Previos

- **Docker** instalado (v20.10 o superior)
- **Docker Compose** instalado (v2.0 o superior)
- Al menos **4GB de RAM** disponibles para los contenedores
- Puertos disponibles: `3000`, `5001`, `6380`, `7475`, `7688`, `9043`, `27018`

---

## ⚡ Inicio Rápido

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd EduScale-Full
```

### 2. Levantar todos los servicios

```bash
docker-compose up --build
```

Este comando:
- Construye las imágenes de frontend y backend
- Levanta todos los contenedores (frontend, backend, Redis, MongoDB, Cassandra, Neo4j)
- Crea las redes y volúmenes necesarios

### 3. Acceder a la aplicación

Una vez que todos los servicios estén corriendo:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Neo4j Browser**: http://localhost:7475 (usuario: `neo4j`, contraseña: `eduscale123`)

**Puertos de las bases de datos:**
- **MongoDB**: localhost:27018
- **Redis**: localhost:6380
- **Cassandra**: localhost:9043
- **Neo4j Bolt**: localhost:7688

---

## 🔧 Comandos Útiles

### Levantar en segundo plano

```bash
docker-compose up -d
```

### Ver logs

```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Detener servicios

```bash
docker-compose down
```

### Detener y eliminar volúmenes (datos)

```bash
docker-compose down -v
```

### Reconstruir imágenes

```bash
docker-compose up --build --force-recreate
```

---

## 📡 Endpoints de la API

### Health Check

```
GET /api/health
```

Devuelve el estado de conexión de todas las bases de datos.

### Fase A - Prospección (Redis)

```
POST   /api/prospection              # Registrar interés
GET    /api/prospection/:email       # Obtener prospecto
GET    /api/prospection/stats/total  # Estadísticas
```

### Fase B - Admisión (MongoDB)

```
POST   /api/admission           # Crear expediente
GET    /api/admission           # Listar expedientes
GET    /api/admission/:email    # Obtener expediente
PUT    /api/admission/:email    # Actualizar expediente
DELETE /api/admission/:email    # Eliminar expediente
```

### Fase C - Inscripción (Cassandra)

```
POST   /api/enrollment                           # Registrar inscripción
GET    /api/enrollment                           # Listar inscripciones
GET    /api/enrollment/institucion/:nombre      # Por institución
GET    /api/enrollment/institucion/:inst/email/:email  # Por institución y email
```

### Relaciones (Neo4j)

```
POST   /api/relations                        # Crear relación
GET    /api/relations/:email                 # Relaciones de estudiante
GET    /api/relations/institucion/:nombre    # Estudiantes por institución
GET    /api/relations/stats/programas-populares  # Programas populares
GET    /api/relations/stats/instituciones    # Listar instituciones
```

---

## 🧪 Ejemplos de Uso

### Registrar un prospecto (Redis)

```bash
curl -X POST http://localhost:5000/api/prospection \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "telefono": "+54 11 1234-5678"
  }'
```

### Crear expediente de admisión (MongoDB)

```bash
curl -X POST http://localhost:5000/api/admission \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "documentos": "DNI, Certificado de estudios",
    "comentarios": "Candidato aprobado",
    "estado": "aprobado"
  }'
```

### Registrar inscripción (Cassandra)

```bash
curl -X POST http://localhost:5000/api/enrollment \
  -H "Content-Type: application/json" \
  -d '{
    "institucion": "Universidad XYZ",
    "email": "juan@example.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "programa": "Ingeniería en Sistemas"
  }'
```

### Crear relación (Neo4j)

```bash
curl -X POST http://localhost:5000/api/relations \
  -H "Content-Type: application/json" \
  -d '{
    "email_estudiante": "juan@example.com",
    "institucion": "Universidad XYZ",
    "programa": "Ingeniería en Sistemas"
  }'
```

---

## 🎯 Casos de Uso por Fase

### Fase A: Prospección (Redis)
- ✅ Registro rápido de interesados
- ✅ Validación de duplicados en tiempo real
- ✅ Rate limiting para evitar spam
- ✅ Datos temporales (TTL de 30 días)

### Fase B: Admisión (MongoDB)
- ✅ Expedientes con estructura flexible
- ✅ Documentos y metadatos variables
- ✅ Historial de cambios
- ✅ Comentarios del comité de admisión

### Fase C: Inscripción (Cassandra)
- ✅ Registros inmutables para auditoría
- ✅ Alta escritura concurrente
- ✅ Particionamiento por institución
- ✅ Escalabilidad masiva

### Relaciones (Neo4j)
- ✅ Análisis de redes
- ✅ Relaciones entre estudiantes, instituciones y programas
- ✅ Consultas de grafos complejas
- ✅ Estadísticas de programas populares

---

## 🔐 Variables de Entorno

Las variables de entorno están configuradas en `docker-compose.yaml` y en `backend/.env.example`.

### Backend

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://mongo:27017/eduscale
CASSANDRA_CONTACT_POINTS=cassandra
CASSANDRA_KEYSPACE=eduscale
REDIS_HOST=redis
REDIS_PORT=6379
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=eduscale123
```

---

## 🛠️ Troubleshooting

### Cassandra tarda en iniciar

Cassandra puede tardar 1-2 minutos en estar completamente disponible. Si el backend falla al conectarse, espera y reinicia:

```bash
docker-compose restart backend
```

### Puerto ya en uso

Si algún puerto está ocupado, puedes modificar los puertos en `docker-compose.yaml`:

```yaml
ports:
  - "3001:80"  # Cambiar 3000 a 3001
```

### Limpiar todo y empezar de cero

```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```

---

## 📚 Tecnologías Utilizadas

### Frontend
- React 18
- React Router
- Axios
- Nginx

### Backend
- Node.js 18
- Express
- Mongoose (MongoDB)
- cassandra-driver
- redis
- neo4j-driver

### Bases de Datos
- MongoDB 7.0
- Cassandra 4.1
- Redis 7
- Neo4j 5.13

### DevOps
- Docker
- Docker Compose

---

## 👥 Autores

**Trabajo Práctico Obligatorio - Ingeniería II**

---

## 📄 Licencia

Este proyecto es parte de un trabajo académico.

---

## 🙏 Agradecimientos

- Cátedra de Ingeniería II
- Universidad XYZ

---

## 📞 Contacto

Para consultas sobre este proyecto, por favor contactar a través del repositorio.

---

**¡Gracias por usar EduScale! 🎓**
