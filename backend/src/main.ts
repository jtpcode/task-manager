import { NestFactory } from '@nestjs/core';
import { ValidationPipe, UnprocessableEntityException } from '@nestjs/common';
import { AppModule } from './app.module';
import morgan from 'morgan';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);
  morgan.token('timestamp', () => new Date().toISOString());
  app.use(morgan('[:timestamp] :method :url :status :response-time ms - :res[content-length]'));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      exceptionFactory: (errors) => new UnprocessableEntityException(errors),
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
};

bootstrap().catch((error) => {
  console.error('Error starting the application:', error);
  process.exit(1);
});
