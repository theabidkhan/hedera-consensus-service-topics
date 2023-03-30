const { Client, AccountId, PrivateKey, Hbar, TopicCreateTransaction, TopicMessageSubmitTransaction, TopicMessageQuery, TopicDeleteTransaction } = require("@hashgraph/sdk");

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

    console.info("=================== CREATING PUBLIC TOPIC ===================")
    // Create a new topic
    let createTopicTxnResponse = await new TopicCreateTransaction().execute(client);

    // Grab the newly generated topic ID
    let createTopicTxnResponseReceipt = await createTopicTxnResponse.getReceipt(client);
    let publicTopicId = createTopicTxnResponseReceipt.topicId;
    console.log(`Public topic ID is: ${publicTopicId}`);

    // Wait 5 seconds between consensus topic creation and subscription creation
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.info("---------- SUBSCRIBING TO THE PUBLIC TOPIC ----------");
    // Subscribe to the topic
    new TopicMessageQuery()
        .setTopicId(publicTopicId)
        .subscribe(client, null, (message) => {
            let messageAsString = Buffer.from(message.contents, "utf8").toString();
            console.log(
                `${message.consensusTimestamp.toDate()} Received: ${messageAsString}`
            );
        });

    console.info("---------- SUBMITTING MESSAGE USING PUBLIC TOPIC ----------\n");
    // Send message to the topic
    let topicMsgSubmitTxn = await new TopicMessageSubmitTransaction({
        topicId: publicTopicId,
        message: "Hello from Public Topic, Abid!",
    }).execute(client);

    // Get the receipt of the transaction
    const topicMsgSubmitTxnReceipt = await topicMsgSubmitTxn.getReceipt(client);

    // Get the status of the transaction
    const topicMsgSubmitTxnStatus = topicMsgSubmitTxnReceipt.status
    console.log("The message transaction status " + topicMsgSubmitTxnStatus.toString());
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.info("=================== CREATING PRIVATE TOPIC ===================\n")
    // Create a new topic
    let pvtTopicCreateTxn = await new TopicCreateTransaction()
        .setAdminKey(myPrivateKey)//as we are deleting this topic hence using setAdminKey otherwise setPublicKey(myPrivateKey.publicKey) can be used here
        .execute(client);

    // Grab the newly generated topic ID
    let pvtTopicCreateTxnReceipt = await pvtTopicCreateTxn.getReceipt(client);
    let pvtTopicId = pvtTopicCreateTxnReceipt.topicId;
    console.log(`Private Topic ID is: ${pvtTopicId}`);

    // Wait 5 seconds between consensus topic creation and subscription creation
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.info("---------- SUBSCRIBING TO THE PRIVATE TOPIC ----------");
    // Subscribe to the topic
    new TopicMessageQuery()
        .setTopicId(pvtTopicId)
        .subscribe(client, null, (message) => {
            let messageAsString = Buffer.from(message.contents, "utf8").toString();
            console.log(
                `${message.consensusTimestamp.toDate()} Received: ${messageAsString}`
            );
        });

    console.info("---------- SUBMITTING MESSAGE USING PRIVATE TOPIC ----------");
    // Send message to private topic
    let pvtTopicMsgSubmitTxn = await new TopicMessageSubmitTransaction({
        topicId: pvtTopicId,
        message: "Hello from Private Topic, Abid!",
    })
        .freezeWith(client)
        .sign(myPrivateKey);

    let pvtSubmitMsgTxSubmit = await pvtTopicMsgSubmitTxn.execute(client);

    // Get the receipt of the transaction
    let pvtGetReceipt = await pvtSubmitMsgTxSubmit.getReceipt(client);

    // Get the status of the transaction
    const pvtTransactionStatus = pvtGetReceipt.status;
    console.log("The message transaction status " + pvtTransactionStatus.toString());

    console.info("---------- DELETING PRIVATE TOPIC ----------");
    //Create the transaction
    const pvtTopicDeleteTxn = await new TopicDeleteTransaction()
        .setTopicId(pvtTopicId)
        .freezeWith(client);
    //Sign the transaction with the admin key
    const signTopicDeleteTxn = await pvtTopicDeleteTxn.sign(myPrivateKey);
    //Sign with the client operator private key and submit to a Hedera network
    const signTopicDeleteTxnResponse = await signTopicDeleteTxn.execute(client);
    //Request the receipt of the transaction
    const receipt = await signTopicDeleteTxnResponse.getReceipt(client);
    //Get the transaction consensus status
    const transactionStatus = receipt.status;
    console.log("The transaction consensus status is " + transactionStatus);
}

void main();