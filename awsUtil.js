var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-2",
//   endpoint: "https://dynamodb.us-east-2.amazonaws.com"
  endpoint: "http://localhost:8000"
});

const docClient = new AWS.DynamoDB.DocumentClient();

// CREATING A TABLE
// 
// const dynamodb = new AWS.DynamoDB();

// var params = {
//   TableName : "Scores",
//   KeySchema: [     
//     { AttributeName: "username", KeyType: "HASH"},  //Partition key
//     { AttributeName: "wpm", KeyType: "RANGE" }  //Sort key
//   ],
//   AttributeDefinitions: [     
//     { AttributeName: "username", AttributeType: "S" },
//     { AttributeName: "wpm", AttributeType: "N" }
//   ],
//   ProvisionedThroughput: {     
//     ReadCapacityUnits: 25, 
//     WriteCapacityUnits: 25
//   }
// };

// dynamodb.createTable(params, function(err, data) {
//   if (err) {
//     console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
//   } else {
//     console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
//   }
// });


// ADDING TO TABLE
// 
// example input: postScore("normal", "John", 81, 0);
async function postScore(kind, name, wpm, errors) {
  try {
    const params = {
      TableName: "Scores",
      Item: {
        username: name,
        wpm: Number(wpm),
        info: {
          kind,
          errors: Number(errors),
        }
      }
    }
    const result = await docClient.put(params).promise();
    console.log("Added item:", result)
  } catch (err) {
    console.log(err);
  }
}

// SCANNING A TABLE
// 
// returns: an object; the useful data array is in key "Items"
// async function fetchScores(kind) {
//   let scores;
//   try {
//     const params = {
//       TableName : "Scores",
//       KeyConditionExpression: "kind = :kind",
//       ExpressionAttributeValues: {
//         ":kind": kind
//       },
//       ScanIndexForward: false
//     };
//     const result = await docClient.query(params).promise();
//     scores = result;
//     // to get the array: result.Items
//   } catch (err) {
//     console.log(err);
//   }
//   return scores;
// }

async function fetchScores(kind) {
  let scores = [];
  try {
    const params = {
      TableName: "Scores",
      ScanIndexForward: false,
    };

    let items;
    do {
      items = await docClient.scan(params).promise();
      items.Items.forEach((item) => {
        if (item.info.kind === kind) {
          if (scores.length > 0) {
            if (item.wpm > scores[scores.length - 1].wpm) {
                scores.unshift(item);
            } else {
                scores.push(item);
            }
          } else {
            scores.push(item);
          }
        }
      });
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey !== 'undefined');
  } catch (err) {
    console.log(err);
  }
  return scores;
}

module.exports = {
  postScore,
  fetchScores,
}