const csvData = Papa.parse('games.csv', { header: true }).data; // https://www.kaggle.com/datasets/datasnaek/chess ----> includes 20,000 Lichess games

//preprocessing
function preprocessChessData(csvData) {
  const x = [];
  const y = [];

  for (const game of csvData) {
    const whiteRating = game.white_rating;
    const blackRating = game.black_rating;
    const openingPly = game.opening_ply;

    // openings 
    let openingName;
    if (game.opening_name === 'Sicilian Defense') {
      openingName = [1, 0, 0, 0, 0];
    } else if (game.opening_name === 'French Defense') {
      openingName = [0, 1, 0, 0, 0];
    } else if (game.opening_name === 'Caro-Kann Defense') {
      openingName = [0, 0, 1, 0, 0];
    } else if (game.opening_name === 'Ruy Lopez') {
      openingName = [0, 0, 0, 1, 0];
    } else {
      openingName = [0, 0, 0, 0, 1];
    }

    // preprocess moves
    const moves = game.moves.split(' ');
    const encodedMoves = [];
    for (const move of moves) {
      const moveCoords = move.slice(-2);
      const xCoord = moveCoords.charCodeAt(0) - 97;
      const yCoord = parseInt(moveCoords.charAt(1)) - 1;
      encodedMoves.push(xCoord);
      encodedMoves.push(yCoord);
    }
    while (encodedMoves.length < 400) {
      encodedMoves.push(8); 
    }
    const movesTensor = tf.tensor2d(encodedMoves, [1, 400]);

    // other features for arrays
    x.push(whiteRating);
    x.push(blackRating);
    x.push(openingPly);
    x.push(...openingName);
    y.push(movesTensor);
  }

  // using tensorflow deep learning model
  const inputTensor = tf.stack(x);
  const outputTensor = tf.stack(y);
  const { mean, variance } = tf.moments(inputTensor, 0);
  const normalizedInput = inputTensor.sub(mean).div(variance.sqrt());

  
  
  return {
    x: normalizedInput,
    y: outputTensor
  };
}

  


  const inputTensor = tf.tensor2d(x);
  const outputTensor = tf.tensor2d(y);
  const { mean, variance } = tf.moments(inputTensor);
  const normalizedInput = inputTensor.sub(mean).div(variance.sqrt());

  // Return preprocessed means
  return {
    x: normalizedInput,
    y: outputTensor
  };
}

const processedData = preprocessChessData(csvData);

// Architecture
const model = tf.sequential();
model.add(tf.layers.dense({
  units: 64,
  activation: 'relu',
  inputShape: [1]
}));
model.add(tf.layers.reshape({
  targetShape: [8, 8, 1]
}));
model.add(tf.layers.conv2d({
  filters: 16,
  kernelSize: 3,
  activation: 'relu'
}));
model.add(tf.layers.maxPooling2d({
  poolSize: [2, 2]
}));
model.add(tf.layers.flatten());
model.add(tf.layers.lstm({
  units: 32
}));
model.add(tf.layers.dense({
  units: 4,
  activation: 'softmax'
}));

model.compile({
  optimizer: tf.train.adam(),
  loss: 'categoricalCrossentropy',
  metrics: ['accuracy']
});

// Train model
const { x, y } = processedData;
model.fit(x, y, {
  epochs: 30, //generally 10, but changed for 30 iterations
  batchSize: 32,
  validationSplit: 0.2
});
