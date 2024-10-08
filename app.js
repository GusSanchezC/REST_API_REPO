const express = require('express') // require -> CommonJS
const crypto = require('node:crypto')
const cors = require('cors')
const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
const PORT = process.env.PORT ?? 3000

app.disable('x-powered-by') // Deshabilitar header X-Powered-By Express
app.use(express.json())
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080',
      'http://localhost:4000',
      'http://movies.com',
      'http://karin.dev'
    ]

    if (ACCEPTED_ORIGINS.includes(origin)) return callback(null, true)
    if (!origin) return callback(null, true)
    return callback(new Error('Not Allowed by CORS'))
  }
})) // Middleware que soluciona el problema de CORS pero lo hace permitiendo todo el acceso a cualquier dominio(no recomendable)
// Metodos normales GET/HEAD/POST
// Metodos complejos PUT/PATCH/DELETE

// CORS PRE-FLIGHT

const ACCEPTED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:4000',
  'http://movies.com',
  'http://karin.dev'
]

app.get('/movies', (req, res) => {
  // const origin = req.header('origin')
  // if (ACCEPTED_ORIGINS.includes(origin) || !origin) res.header('Access-Control-Allow-Origin', origin)

  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase()))
    return res.json(filteredMovies)
  }
  res.json(movies)
})

app.get('/movies/:id', (req, res) => {
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)
  res.status(404).send('Movie not found')
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)
  if (result.error) {
    res.status(400).json({ error: JSON.parse(result.error.message) })
  }
  const newMovie = {
    id: crypto.randomUUID(), // uuid v4
    ...result.data
  }
  movies.push(newMovie)
  res.status(201).json(newMovie) // actualizar la cache del cliente
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)
  if (!result.success) {
    res.status(400).json({ error: JSON.parse(result.error.message) })
  }
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) return res.status(404).json({ message: 'Movie not found' })

  const updatedMovie = {
    ...movies[movieIndex],
    ...result.data
  }
  movies[movieIndex] = updatedMovie
  return res.json(updatedMovie)
})

app.delete('/movies/:id', (req, res) => {
  // const origin = req.header('origin')
  // if (ACCEPTED_ORIGINS.includes(origin) || !origin) res.header('Access-Control-Allow-Origin', origin)

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)
  if (movieIndex === -1) return res.status(404).json({ message: 'Movie not found' })
  movies.splice(movieIndex, 1)
  return res.status(204).json({ message: 'movie deleted' })
})

app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
  }
  res.send()
})

app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`)
})
