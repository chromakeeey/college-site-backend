const express = require("express")
const config = require("config")
const { connectionPool } = require('./mysql/connection')

const app = express()
const PORT = config.get('port') || process.env.PORT

app.use(express.json({extended: true}))

app.use('/api/', require('./routes/user.route'))
app.use('/api/', require('./routes/subject.route'))
app.use('/api/', require('./routes/specialty.route'))

app.listen(PORT, () => {
    console.log(`App has been started on port ${PORT}...`)
});
