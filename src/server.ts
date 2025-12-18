import { createApp } from './app';
import { env } from './shared/config/env';
import { initDatabase } from './shared/database/connection';

async function bootstrap() {
  try {
    // Inicializar banco de dados
    await initDatabase();
    console.log('✅ Banco de dados conectado');

    // Criar app Express
    const app = createApp();

    // Iniciar servidor
    app.listen(env.port, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${env.port}`);
      console.log(`📋 Health check: http://localhost:${env.port}/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

bootstrap();
