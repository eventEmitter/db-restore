# db-restore

[![Greenkeeper badge](https://badges.greenkeeper.io/eventEmitter/db-restore.svg)](https://greenkeeper.io/)

creates a db from sql files


### Usage

    db-restore --config=config.js --data-dir=../data-dir


all options are optional. if you ommit one the following defaults are used:

- config: $pwd/config.js
- data-dir: $pwd/data/


All paths may be relative and will be resolved rtelative to $pwd


#### Option --config=

Contains the path to a config file which must export the following object:

    module.exports = {
          database: 'myDb'
        , user: 'root'
        , pass: 'secure'
        , host: 'somne.domain'
        , port: 5432
    };


#### Option --data-dir=

Specifies the folder from where the dumps will be loaded