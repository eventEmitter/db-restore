(function() {
    'use strict';

    const path = require('path');
    const fs = require('fs');
    const cp = require('child_process');
    const log = require('ee-log');
    const readline = require('readline');





    // add sequential promise worker
    Promise.sequence = (promises) => {
        const results = [];

        const execute = (index) => {
            if (promises.length > index) {
                return promises[index]().then((result) => {
                    results.push(result);
                    return execute(index+1);
                });
            } else return Promise.resolve(results);
        };

        return execute(0);
    };










    module.exports = class DBRestore {


        constructor(options) {
            this.dataDir = options.dataDir;
            this.config = options.config;
            this.silent = options.silent;
        }




        restore() {
            const configurations = new Set();

            if (!this.silent) log.info(`Starting to restore the database to ${this.config.database} from the data dir ${this.dataDir} ...`);


            // lets start
            return new Promise((resolve, reject) => {
                if (!this.silent) log.info(`Enumerating sql files fro restoration ...`);

                // enumerate the configs
                fs.readdir(this.dataDir, (err, files) => {
                    if (err) return reject(err);
                    else if (files && files.length) return resolve(files);
                    else return reject(new Error(`No sql files found ...`));
                });
            }).then((files) => {
                if (!this.silent) log.success(`Found ${files.length} files ...`);
                if (!this.silent) log.info(`Starting restoration ...`);


                // dump the structure
                return Promise.sequence([() => {
                    if (!this.silent) log.debug(`Dropping database ${this.config.database} ...`);

                    return new Promise((resolve, reject) => {
                        cp.exec(`PGPASSWORD="${this.config.pass}" psql -U ${this.config.user} -h ${this.config.host} -p ${this.config.port} -c 'drop database if exists "${this.config.database}";'`, {maxBuffer: 1024*1024*20}, (err, stdOut, stdErr) => {
                            if (err) reject(err);
                            else {
                                if (!this.silent) log.debug(`Database ${this.config.database} created ...`);
                                resolve();
                            }
                        });
                    });
                }, () => {
                    if (!this.silent) log.debug(`Creating database ${this.config.database} ...`);

                    return new Promise((resolve, reject) => {
                        cp.exec(`PGPASSWORD="${this.config.pass}" psql -U ${this.config.user} -h ${this.config.host} -p ${this.config.port} -c 'create database "${this.config.database}";'`, {maxBuffer: 1024*1024*20}, (err, stdOut, stdErr) => {
                            if (err) reject(err);
                            else {
                                if (!this.silent) log.debug(`Database ${this.config.database} created ...`);
                                resolve();
                            }
                        });
                    });
                }].concat(files.map((sqlFile) => {
                    return () => {
                        const file = path.join(this.dataDir, sqlFile);
                        if (!this.silent) log.debug(`restoring ${file} ...`);

                        return new Promise((resolve, reject) => {
                            cp.exec(`PGPASSWORD="${this.config.pass}" psql --dbname=${this.config.database} -U ${this.config.user} -h ${this.config.host} -p ${this.config.port} -f ${file} ${this.config.database}`, {maxBuffer: 1024*1024*20}, (err, stdOut, stdErr) => {
                                if (err) reject(err);
                                else {
                                    if (!this.silent) log.debug(`Restore of ${file} succeeded ...`);
                                    resolve();
                                }
                            });
                        });
                    };            
                })));
            }).then(() => {
                if (!this.silent) log.success(`Restoration for ${this.config.database} completed!`);

                return Promise.resolve();
            });
        }
    }   
})();
