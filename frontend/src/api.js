const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";


export async function checkBackend() {

  try {

    const response = await fetch(
      `${API_URL}/api/health`
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();

  } catch (error) {

    console.error(
      "Backend connection error:",
      error
    );

    return null;
  }
}


export async function askAgent(
  question,
  businessData
) {

  const response = await fetch(
    `${API_URL}/api/agent`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        question,
        business_data: businessData,
      }),
    }
  );


  if (!response.ok) {

    const errorText =
      await response.text();

    throw new Error(
      `Agent error ${response.status}: ${errorText}`
    );
  }


  return await response.json();
}