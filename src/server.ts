import { app } from "./app.ts";
import { connectMongo } from "./database/mongodb.ts";

const PORT = process.env.PORT || 3333;

// Inicializa conexões com bancos secundários
connectMongo()
  .then(() => console.log("MongoDB inicializado no startup"))
  .catch((err) => console.error("Falha ao inicializar MongoDB no startup:", err));

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
