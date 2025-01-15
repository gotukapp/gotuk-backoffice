import axios from 'axios';

export async function POST({ request }) {
    try {
        const body = await request.json(); // Parse incoming JSON from the client
        const { token, title, body: messageBody } = body; // Extract data
        console.log(token, title, messageBody)



        if (!token || !title || !messageBody) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const url = 'https://sendnotification-m4ti3eo3ua-uc.a.run.app'

        const headers = {
            'Content-Type': 'application/json'
        }

        const payload = {
            "token": token,
            "body": messageBody,
            "title": title
        }

        const response = await axios.post(
            url,
            payload,
            {
                headers: headers,
            }
        );

        if (response.status === 200) {
            console.log("Notification sent successfully: " + response.data);
        } else {
            console.log("Failed to send notification: " + response.data);
        }

        return new Response(JSON.stringify(response.data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.response?.data || error.message }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
