import * as tf from '@tensorflow/tfjs-node';
import * as csv from 'csvtojson';
import * as fs from 'fs';

const chessData = [];
const labelData = [];

const csvFilePath = 'games.csv';
csv()
  .fromFile(csvFilePath)
  .subscribe((chessGame) => {
  
    // Preprocessing
    const whiteRating = parseFloat(chessGame.white_rating);
    const blackRating = parseFloat(chessGame.black_rating);
    const openingPly = parseInt(chessGame.opening_ply);
    const moves = chessGame.moves.split(' ');

    // one-hot encoding
    const moveMapping = {};
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      if (!(move in moveMapping)) {
        moveMapping[move] = Object.keys(moveMapping).length;
      }
    }

    const moveData = new Array(moves.length);
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      moveData[i] = moveMapping[move];
    }

    // arrays for data
    const input = [
      whiteRating,
      blackRating,
      openingPly,
      ...moveData
    ];
    const label = (chessGame.winner === 'white') ? 1 : 0;

    chessData.push(input);
    labelData.push(label);
  }, 
  (error) => {
    console.log(error);
  },
  () => {
    // tensors has data
    const chessTensor = tf.tensor2d(chessData);
    const labelTensor = tf.tensor1d(labelData);

    // do mean
    const { dataMean, dataStd } = tf.moments(chessTensor, 0);
    const normalizedChessTensor = chessTensor.sub(dataMean).div(dataStd);

    // architecture for deep learning
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [normalizedChessTensor.shape[1]], units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    const optimizer = tf.train.adam();
    model.compile({ optimizer: optimizer, loss: 'binaryCrossentropy', metrics: ['accuracy'] });

    const batchSize = 128;
    const epochs = 30; //30 iterations through data set
    model.fit(normalizedChessTensor, labelTensor, {
      batchSize: batchSize,
      epochs: epochs,
      shuffle: true,
      callbacks: tf.node.tensorBoard('/tmp/chess_bot')
    }).then((history) => {
      console.log(history);
      model.save('model');
      const gameTensor = tf.tensor2d([
  [2000, 1800, 5, 1, 7, 9, 11, 2, 4, 6],
  [1800, 2000, 5, 1, 7, 9, 11, 2, 4, 6],
  [2000, 1800, 5, 1, 7, 9, 11, 2, 4, 6],
  [1800, 2000, 5, 1, 7, 9, 11, 2, 4, 6]
]);
  const normalizedGameTensor = gameTensor.sub(dataMean).div(dataStd);
  const predictionTensor = model.predict(normalizedGameTensor);
  const prediction = predictionTensor.dataSync()[0];
  console.log(`The model predicts that the player ${prediction > 0.5 ? 'will win' : 'will lose'}.`);
  if (prediction > 0.5) {
    console.log("It looks like you're winning. Keep up the good work!");
  } else {
    console.log("It looks like you're losing. Try to make some different moves and see if you can turn things around!");
  }
