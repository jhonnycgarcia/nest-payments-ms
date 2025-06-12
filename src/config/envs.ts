import 'dotenv/config';
import * as joi from 'joi';

interface EnvConfig {
  PORT: number;
  STRIPE_SECRET: string;
}

const envSchema = joi.object({
  PORT: joi.number().required(),
  STRIPE_SECRET: joi.string().required(),
}).unknown(true);

const { value: envConfig, error } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvConfig = envConfig;

export const envs = {
  PORT: envVars.PORT,
  STRIPE_SECRET: envVars.STRIPE_SECRET,
};
