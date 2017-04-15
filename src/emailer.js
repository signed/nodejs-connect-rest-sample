var emailContent = '<html>\n<head>\n  <meta http-equiv=\'Content-Type\' content=\'text/html; charset=us-ascii\'>\n  <title></title></head>\n<body style=\'font-family:calibri\'>\n<p> Hello {{name}},</p>\nwelcome to your personal attachment\n</body>\n</html>';

/**
 * Returns the outbound email message content with the supplied name populated in the text
 * @param {string} name The proper noun to use when addressing the email
 * @return {string} the formatted email body
 */
function getEmailContent(name) {
  return emailContent.replace('{{name}}', name);
}

/**
 * https://developer.microsoft.com/en-us/graph/docs/api-reference/v1.0/api/user_sendmail
 *
 * Wraps the email's message content in the expected [soon-to-deserialized JSON] format
 * @param {string} content the message body of the email message
 * @param {string} recipient the email address to whom this message will be sent
 * @return the message object to send over the wire
 */
function wrapEmail(content, recipient) {
  var emailAsPayload = {
    Message: {
      Subject: 'Graph Tutorial Mail',
      Body: {
        ContentType: 'HTML',
        Content: content
      },
      ToRecipients: [
        {
          EmailAddress: {
            Address: recipient
          }
        }
      ],
      Attachments: [
        {
          "@odata.type": "#Microsoft.OutlookServices.FileAttachment",
          "Name": "menu.txt",
          "ContentBytes": "bWFjIGFuZCBjaGVlc2UgdG9kYXk="
        }
      ]
    },
    SaveToSentItems: true
  };
  return emailAsPayload;
}

/**
 * Delegating method to wrap the formatted email message into a POST-able object
 * @param {string} name the name used to address the recipient
 * @param {string} recipient the email address to which the connect email will be sent
 */
function generateMailBody(name, recipient) {
  return wrapEmail(getEmailContent(name), recipient);
}

exports.generateMailBody = generateMailBody;
