const { Client, AccountId, PrivateKey, Hbar, TopicCreateTransaction, TopicMessageSubmitTransaction, TopicDeleteTransaction } = require("@hashgraph/sdk");

require("dotenv").config();

async function main() {
    if (process.env.MY_ACCOUNT_ID == null || process.env.MY_PRIVATE_KEY == null) {
        throw new Error(
            "Environment variables OPERATOR_ID, and OPERATOR_KEY are required."
        );
    }

    //setting my accountId and my privateKey
    const myAccountId = AccountId.fromString(process.env.MY_ACCOUNT_ID);
    const myPrivateKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);

    //setting the client for testNet by using myAccountId and myPrivateKey
    const client = Client.forTestnet().setOperator(myAccountId, myPrivateKey);

    console.info("---------- CREATING NEW TOPIC ----------");
    //Create the transaction
    const topicCreateTxn = new TopicCreateTransaction()
        .setAdminKey(myPrivateKey);
    //Sign with the client operator private key and submit the transaction to a Hedera network
    const topicCreateTxnResponse = await topicCreateTxn.execute(client);
    //Request the receipt of the transaction
    const topicCreateTxnResponseReceipt = await topicCreateTxnResponse.getReceipt(client);
    //Get the topic ID
    const newTopicId = topicCreateTxnResponseReceipt.topicId;
    console.log("The new topic ID is " + newTopicId);


    console.info("---------- SUBMITTING MESSAGE USING TOPIC ----------");
    //Create the transaction
    const topicMsgTxn = await new TopicMessageSubmitTransaction()
        .setTopicId(newTopicId)
        .setMessage("Hello from Abid! ");
    //Get the transaction message
    console.info("Message : " + topicMsgTxn.getMessage());


    console.info("---------- DELETING TOPIC ----------");
    //Create the transaction
    const topicDeleteTxn = await new TopicDeleteTransaction()
        .setTopicId(newTopicId)
        .freezeWith(client);
    //Sign the transaction with the admin key
    const signTopicDeleteTxn = await topicDeleteTxn.sign(myPrivateKey);
    //Sign with the client operator private key and submit to a Hedera network
    const signTopicDeleteTxnResponse = await signTopicDeleteTxn.execute(client);
    //Request the receipt of the transaction
    const receipt = await signTopicDeleteTxnResponse.getReceipt(client);
    //Get the transaction consensus status
    const transactionStatus = receipt.status;
    console.log("The transaction consensus status is " + transactionStatus);
}

void main();