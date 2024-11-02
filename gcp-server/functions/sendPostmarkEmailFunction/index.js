const fetch = require('node-fetch');

exports.sendPostmarkEmail = async (req, res) => {
    const postmarkApiUrl = "https://api.postmarkapp.com/email/withTemplate";
    const postmarkApiKey = "7456c6b5-9905-4911-9eba-3db1a9f2b4b1"; // Your Postmark server key

    // Extract data from the request body
    const data = req.body;

    // Prepare the template model with dynamic values
    const templateModel = {
        name: data.name || "Customer",
        ticketNumber: data.ticketNumber || "N/A",
        phone: data.phone || "N/A",
        carYear: data.carYear || "N/A",
        carMake: data.carMake || "N/A",
        carModel: data.carModel || "N/A",
        carTrim: data.carTrim || "N/A",
        comments: data.comments || "N/A",
    };

    // Prepare the email payload
    const emailPayload = {
        From: "kyle@fixthings.pro", // Replace with your verified sender email
        To: data.email, // The recipient's email address
        TemplateAlias: "CustomerSignupEmail", // Use the template alias instead of ID
        TemplateModel: templateModel, // Pass the model with dynamic values
    };

    // Send the email using Postmark
    try {
        const response = await fetch(postmarkApiUrl, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-Postmark-Server-Token": postmarkApiKey,
            },
            body: JSON.stringify(emailPayload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            res.status(500).send(`Failed to send confirmation email: ${errorData.Message || "Unknown error"}`);
            return;
        }

        res.status(200).send("Email sent successfully");
    } catch (error) {
        res.status(500).send(`Error sending email: ${error.message || "Unknown error"}`);
    }
};