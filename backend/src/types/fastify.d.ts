import { IDownloadRepository } from '../interfaces/download.repository.interface';

// Extend FastifyInstance to include our plugin decorations
// Using proper type definitions for Fastify to ensure type safety
declare module 'fastify' {
  interface FastifyInstance {
    downloadRepository: IDownloadRepository;
  }
}
