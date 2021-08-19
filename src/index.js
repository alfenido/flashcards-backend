const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Chance = require('chance')
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json());


const decks = [
    // Um exemplo só pra debugar e ter o id fixo pras requisições rest.
    {
        id: "f8f214ec-3bf3-457b-bf11-96a7be20cf88",
        title: "Deck de exemplo",
        description: "Este é o meu primeiro deck - de exemplo",
        course: 'PHP',
        cards: [
            {
            id: "a399e053-a3df-4768-b0d6-5335ae7a61fd",
            question: "Primeira questão",
            aswer: "Primeira resposta",
            weight: 1,
            last_time_visualized: new Date()
        }
        ],
        last_time_visualized : new Date()
    }
];


// Middleware
function verifyDeck(request, response, next) {
    const {deck_id} = request.params;

    const deck = decks.find(deck => deck.id === deck_id);
    if (!deck) {
        response.json({error: 'Deck não encontrado'});
    }
    request.deck = deck;
    next();
}
function verifyCard(request, response, next) {
    const { card_id } = request.params;
    const card = request.deck.cards.find(card => card.id === card_id);
    if (!card) {
        response.json({error: 'Card não encontrado'});
    }
    request.card = card;
    next();
    
}

// Inclui um novo deck
app.post('/decks', (request, response) => {
    const {title, description, course} = request.body;

    const rawDeck = {
        id: uuidv4(),
        title,
        course,
        description,
        cards: [],
    }

    decks.push(rawDeck);
    response.status(201).json(rawDeck);
})

// Ver todos os decks
app.get('/decks',  (request, response)=> {
    response.json(decks);
})

// Ver um deck específico
app.get('/decks/:deck_id', verifyDeck, (request, response)=>{
    response.json(request.deck);
})

// Cria uma nova Card em um Deck específico.
app.post('/decks/:deck_id/card', verifyDeck, (request, response) => {

    const { question, aswer } = request.body;

    const rawCard = {
        id: uuidv4(),
        question,
        aswer,
        weight: 1,
        last_time_visualized : new Date()
    }

    request.deck.cards.push(rawCard);
    response.status(201).json(rawCard);

})


// Resposta do aluno se acertou ou errou, com o aumento do peso de acordo.
app.post('/decks/:deck_id/card/:card_id', verifyDeck, verifyCard, (request, response) => {
    const {aswer} = request.body;
    const { card } = request;

    // Multiplicador de peso, que vai aumentar a frequencia das cartas "miss"
    const definedWeightMultiplier = 0.1;

    
    switch(aswer) {
        case 'hit':            
            if (card.weight > definedWeightMultiplier)
                card.weight -= definedWeightMultiplier;
            break;
        case 'miss':
            card.weight += definedWeightMultiplier;
            break;
        default:
            response.json({error: 'O tipo de resposta tem que ser hit (Acerto) ou miss (erro).'})
    }

    // Fix besta pra limitar o número de caracteres depois da virgula
    card.weight = parseFloat(card.weight.toFixed(2));

    // salva o horário da ultima visualização deste card. Pode ser útil.
    card.last_time_visualized = new Date();
   
    response.json(card);
})

/*
    Seleciona um Card aleatório baseado no weight de cada card 
    (Quanto maior o weight, maior a probabilidade da carta ser selecionada)
*/

app.get('/decks/:deck_id/play', verifyDeck, (request, response) => {
    const { deck } = request;
    const cards = deck.cards;

    
    const weights = cards.map((c)=>c.weight);

    var chance = new Chance();
    const sortedArray = chance.weighted(cards, weights);



    //const cardsCopy = JSON.parse(JSON.stringify(cards));

    let cardsCopy = [...cards];

    let myCard = cardsCopy.find((c)=>{
        return c.id == 'a399e053-a3df-4768-b0d6-5335ae7a61fd'
    });

    myCard.aswer = 'teste';

    console.log(cards);

    
    response.json(sortedArray);
})

app.listen(process.env.PORT || 3333);
console.log('Running on port http://localhost:3333/');