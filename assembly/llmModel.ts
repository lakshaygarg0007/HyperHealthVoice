import {models as modusModels } from "@hypermode/modus-sdk-as";
import { Model as functionsModels } from "@hypermode/models-as";
import { EmbeddingsModel } from "@hypermode/modus-sdk-as/models/experimental/embeddings"

import {
  OpenAIChatModel,
  ResponseFormat,
  SystemMessage,
  UserMessage,
} from "@hypermode/modus-sdk-as/models/openai/chat"



// this model name should match the one defined in the modus.json manifest file
const modelName: string = "text-generator"

export function generateText(instruction: string, prompt: string): string {
  const model = modusModels.getModel<OpenAIChatModel>(modelName)
  const input = model.createInput([
    new SystemMessage(instruction),
    new UserMessage(prompt),
  ])


  input.temperature = 0.7

  const output = model.invoke(input)
  
  return output.choices[0].message.content.trim()
}


export function embed(texts: string[]): f32[][] {
  const model = modusModels.getModel<EmbeddingsModel>("minilm")
  const input = model.createInput(texts)
  const output = model.invoke(input)
  return output.predictions
}

// AssemblyScript version of text splitting

// Helper function to split text into chunks