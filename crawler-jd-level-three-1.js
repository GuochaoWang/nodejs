var Crawler = require("crawler");
var fs = require('fs');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
//var Iconv = require('iconv').Iconv;

var filename = "zhongguo";
var maxpage = 100;
var currpage = 1;
var levelOneData = [];

var config = {
    userName: 'sa',
    password: '700bike520',
    server: '127.0.0.1',
    options: {
        database: "Address",
        
    }
};
//var connection = new Connection(config);

function addToSql(head, list) {
    var psurl = head.surl;
    list.forEach(function(obj) {
        var connection = new Connection(config);
        connection.on('connect',
            function(err) {
                //console.log(err);
                // If no error, then good to go...
                executeInsert(psurl, obj, connection);
            }
        );
    });
}

function queryToSql() {
    var connection = new Connection(config);
    connection.on('connect',
        function(err) {
            //console.log(err);
            // If no error, then good to go...
            executeQuery(connection);
        }
    );
}

function executeInsert(psurl, obj, conn) {
    //select id from address where first_name = @name and age > @age
    //    INSERT INTO [Address].[dbo].[LevelOne]
    //    ([surl]
    //        ,[sname]
    //        ,[map_x]
    //        ,[map_y]
    //        ,[map_info]
    //        ,[alias]
    //        ,[address]
    //        ,[pic_url]
    //        ,[full_url]
    //        ,[kaopu_remark]
    //        ,[more_desc])
    //    VALUES
    //        (<surl, varchar(100),>
    //    ,<sname, nvarchar(100),>
    //    ,<map_x, decimal(18,6),>
    //    ,<map_y, decimal(18,6),>
    //    ,<map_info, nvarchar(100),>
    //    ,<alias, nvarchar(300),>
    //    ,<address, nvarchar(300),>
    //    ,<pic_url, varchar(300),>
    //    ,<full_url, varchar(300),>
    //    ,<kaopu_remark, nvarchar(600),>
    //    ,<more_desc, nvarchar(3000),>)
    //GO

    var request = new Request(
        "insert into [LevelThree] ([psid],[sid],[psurl],[surl],[sname],[map_x],[map_y],[map_info],[alias],[address],[pic_url],[full_url],[kaopu_remark],[more_desc]) " +
        " VALUES (@psid,@sid,@psurl,@surl,@sname,@map_x,@map_y,@map_info,@alias,@address,@pic_url,@full_url,@kaopu_remark,@more_desc)",
        function (err, rowCount) {
            if (err) {
                //console.log(err);
                conn.close();
            } else {
                //console.log(rowCount + ' rows');
                conn.close();
            }
        });

    //surl: i.surl,
    //    sname: i.sname,
    //    map_x: i.ext.map_x,
    //    map_y: i.ext.map_y,
    //    map_info: i.ext.map_info,
    //    en_sname: i.ext.en_sname,
    //    alias: i.ext.alias,
    //    address: i.ext.address,
    //    pic_url: i.cover.pic_url,
    //    full_url: i.cover.full_url,
    
    request.addParameter('psid', TYPES.VarChar, obj.parent_sid);
    request.addParameter('sid', TYPES.VarChar, obj.sid);
    request.addParameter('psurl', TYPES.VarChar, psurl);
    request.addParameter('surl', TYPES.VarChar, obj.surl);
    request.addParameter('sname', TYPES.NVarChar, obj.sname);
    request.addParameter('map_x', TYPES.Decimal, obj.ext.map_x);
    request.addParameter('map_y', TYPES.Decimal, obj.ext.map_y);
    request.addParameter('map_info', TYPES.NVarChar, obj.ext.map_info);
    request.addParameter('alias', TYPES.NVarChar, obj.ext.alias ? obj.ext.alias : "");
    request.addParameter('address', TYPES.NVarChar, obj.ext.address ? obj.ext.address : "");
    request.addParameter('pic_url', TYPES.VarChar, obj.cover && obj.cover.pic_url ? obj.cover.pic_url : "");
    request.addParameter('full_url', TYPES.VarChar, obj.cover && obj.cover.full_url != undefined ? obj.cover.full_url : "");
    request.addParameter('kaopu_remark', TYPES.NVarChar, obj.kaopu_remark != undefined ? obj.kaopu_remark : "");
    request.addParameter('more_desc', TYPES.NVarChar, obj.ext.more_desc != undefined ? obj.ext.more_desc : "");

    conn.execSql(request);
}

function executeQuery(conn) {
    var request = new Request("select [surl] from LevelTwo where [statusflag]=0 and [leveltwoid] >= 5686 and [leveltwoid] < 20000", function (err, rowCount) {
        if (err) {
            //console.log(err);
        } else {
            console.log(rowCount + ' rows');
            setCrawlerQueueWhenSurlChanage();
            conn.close();
        }
    });

    request.on('row',
        function(columns) {
            levelOneData.push({ surl: columns[0].value })
            //console.log(levelOneData.length);
        });

    conn.execSql(request);
}

function checkCsvEmpty(val) {
    if (val && val != "") {
        return val.trim();
    }
    return "null";
}

function pushJdData(obj) {
    obj.data.scene_list.forEach(function (i) {
        jddata.push({
            surl: i.surl,
            sname: i.sname,
        });
    });
}

var c = new Crawler({
    rateLimit: 1000, // `maxConnections` will be forced to 1
    // maxConnections: 10,
    // This will be called for each crawled page
    callback: function (error, res, done) {
        if (error) {
            //console.log(error);
            console.log("error timeout: " + error);
        } else {
            var $ = res.$;
            // $ is Cheerio by default
            //a lean implementation of core jQuery designed specifically for the server
            //console.log($.text());

            if ($) {
                var json = $.text();

                var obj = null;

                try {
                    obj = JSON.parse(json);
                } catch (err) {

                    json = json.replace('0"\\u', '0\\u');
                    json = json.replace('1"\\u', '1\\u');
                    json = json.replace('2"\\u', '2\\u');
                    json = json.replace('3"\\u', '3\\u');
                    json = json.replace('4"\\u', '4\\u');
                    json = json.replace('5"\\u', '5\\u');
                    json = json.replace('6"\\u', '6\\u');
                    json = json.replace('7"\\u', '7\\u');
                    json = json.replace('8"\\u', '8\\u');
                    json = json.replace('9"\\u', '9\\u');

                    json = json.replace('a"\\u', 'a\\u');
                    json = json.replace('b"\\u', 'b\\u');
                    json = json.replace('c"\\u', 'c\\u');
                    json = json.replace('d"\\u', 'd\\u');
                    json = json.replace('e"\\u', 'e\\u');
                    json = json.replace('f"\\u', 'f\\u');
                    json = json.replace('g"\\u', 'g\\u');

                    json = json.replace('h"\\u', 'h\\u');
                    json = json.replace('i"\\u', 'i\\u');
                    json = json.replace('j"\\u', 'j\\u');
                    json = json.replace('k"\\u', 'k\\u');
                    json = json.replace('l"\\u', 'l\\u');
                    json = json.replace('m"\\u', 'm\\u');
                    json = json.replace('n"\\u', 'n\\u');

                    json = json.replace('o"\\u', 'o\\u');
                    json = json.replace('p"\\u', 'p\\u');
                    json = json.replace('q"\\u', 'q\\u');
                    json = json.replace('r"\\u', 'r\\u');
                    json = json.replace('s"\\u', 's\\u');
                    json = json.replace('t"\\u', 't\\u');

                    json = json.replace('u"\\u', 'u\\u');
                    json = json.replace('v"\\u', 'v\\u');
                    json = json.replace('w"\\u', 'w\\u');
                    json = json.replace('x"\\u', 'x\\u');
                    json = json.replace('y"\\u', 'y\\u');
                    json = json.replace('z"\\u', 'z\\u');


                    try {
                        obj = JSON.parse(json);
                    } catch (err) {
                        //console.log("error parse: " + err);
                    }
                }

                if (obj != null) {
                    //console.log(obj);
                    if (obj.data.scene_list && obj.data.scene_list.length > 0) {
                        addToSql(obj.data, obj.data.scene_list);
                        console.log(currpage + " page --------------------");
                        currpage++;
                        errorCount = 0;
                        setCrawlerQueueWhenPageChange();
                    } else {
                        console.log(filename + " surl --------------------");
                        levelOneDataIndex++;
                        errorCount = 0;
                        setCrawlerQueueWhenSurlChanage();
                    }

                } else {
                    if (errorCount == 5) {
                        levelOneDataIndex++;
                        errorCount = 0;
                        setCrawlerQueueWhenSurlChanage();
                    } else {
                        console.log("error parse 1. currpage: " + currpage + " surl " + filename);
                        currpage++;
                        errorCount++;
                        setCrawlerQueueWhenPageChange();
                    }
                }
            } else {
                if (errorCount == 5) {
                    levelOneDataIndex++;
                    errorCount = 0;
                    setCrawlerQueueWhenSurlChanage();
                } else {
                    console.log("error parse 0. currpage: " + currpage + " surl " + filename);
                    currpage++;
                    errorCount++;
                    setCrawlerQueueWhenPageChange();
                }
            }
            

            //pushJdData(obj);

            //console.log(currpage + " page --------------------");

            //currpage++;

            //{ "errno":0, "msg": "", "data":{ "surl":"", "sname":"", "ext":["map_x":456,"map_y":569, "map_info"], "scene_list":[{ "surl":"", "sname":"", "ext":["map_x":456,"map_y":569, "map_info", "alias":"", "en_sname":"", "address":"","phone":"",""],"cover":{"pic_url":"", "full_url":""}  }] }

            //if (currpage > maxpage) {
            //    saveDataToCsv();
            //}
        }
        done();
    }
});

queryToSql();

var levelOneDataIndex = 0;
var errorCount = 0;

function setCrawlerQueueWhenSurlChanage() {
    currpage = 1;
    if (levelOneData.length > 0 && levelOneDataIndex < levelOneData.length) {
        filename = levelOneData[levelOneDataIndex].surl
        c.queue('https://lvyou.baidu.com/destination/ajax/jingdian?format=ajax&cid=0&playid=0&seasonid=5&surl=' +
            filename +
            '&pn=' +
            currpage +
            '&rn=18');
    }
}

function setCrawlerQueueWhenPageChange() {
    c.queue('https://lvyou.baidu.com/destination/ajax/jingdian?format=ajax&cid=0&playid=0&seasonid=5&surl=' +
        filename +
        '&pn=' +
        currpage +
        '&rn=18');
}




