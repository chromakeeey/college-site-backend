const express = require("express")
const config = require("config")
const { connection } = require('./mysql/connection')

const app = express()
const PORT = config.get('port') || process.env.PORT

app.use(express.json({extended: true}))

app.use('/api/', require('./routes/user.route'))
app.use('/api/', require('./routes/subject.route'))
app.use('/api/', require('./routes/specialty.route'))

async function start() {
    try {
        connection.connect( function(err){
            if (err) {
                return console.error("Error connect: " + err.message);
            } else {
                console.log("MySQL success connect");
            }
        });

        app.listen(PORT, () => console.log(`App has been started on port ${PORT}...`) )
    } catch(e) {
        console.log('Server error', e.message)
        process.exit(1)
    }
}

start()