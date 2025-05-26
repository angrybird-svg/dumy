const { AutoTokenizer, AutoModelForCausalLM } = require('@huggingface/transformers');

let tokenizer;
let model;

async function loadModel() {
  try {
    tokenizer = await AutoTokenizer.from_pretrained("HuggingFaceH4/zephyr-7b-beta");
    model = await AutoModelForCausalLM.from_pretrained("HuggingFaceH4/zephyr-7b-beta");
    console.log("Model loaded successfully");
  } catch (err) {
    console.error("Failed to load model:", err);
    process.exit(1); // Exit if model fails to load
  }
}

function getModel() {
  return { tokenizer, model };
}

module.exports = { loadModel, getModel };