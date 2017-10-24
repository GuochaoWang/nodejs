var Crawler = require("crawler");
var fs = require('fs');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
//var Iconv = require('iconv').Iconv;

var filename = "zhongguo";
var jddata = [];
var maxpage = 80;
var currpage = 1;

var config = {
    userName: 'sa',
    password: '700bike520',
    server: '127.0.0.1',
    options: {
        database: "Address",
        
    }
};
//var connection = new Connection(config);

function addToSql(list) {
    list.forEach(function (obj) {
        var connection = new Connection(config);
        connection.on('connect', function (err) {
                //console.log(err);
                // If no error, then good to go...
                executeInsert(obj, connection);
            }
        );
    });
    
}

function queryToSql() {
    connection = new Connection(config);
    connection.on('connect', function (err) {
            //console.log(err);
            // If no error, then good to go...
            executeQuery();
        }
    );
}

function executeInsert(obj, conn) {
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
        "insert into [LevelOne] ([surl],[sname],[map_x],[map_y],[map_info],[alias],[address],[pic_url],[full_url],[kaopu_remark],[more_desc]) " +
        " VALUES (@surl,@sname,@map_x,@map_y,@map_info,@alias,@address,@pic_url,@full_url,@kaopu_remark,@more_desc)",
        function (err, rowCount) {
            if (err) {
                console.log(err);
            } else {
                console.log(rowCount + ' rows');
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

    request.addParameter('surl', TYPES.VarChar, obj.surl);
    request.addParameter('sname', TYPES.NVarChar, obj.sname);
    request.addParameter('map_x', TYPES.Decimal, obj.ext.map_x);
    request.addParameter('map_y', TYPES.Decimal, obj.ext.map_y);
    request.addParameter('map_info', TYPES.NVarChar, obj.ext.map_info);
    request.addParameter('alias', TYPES.NVarChar, obj.ext.alias);
    request.addParameter('address', TYPES.NVarChar, obj.ext.address);
    request.addParameter('pic_url', TYPES.VarChar, obj.cover.pic_url);
    request.addParameter('full_url', TYPES.VarChar, obj.cover.full_url);
    request.addParameter('kaopu_remark', TYPES.NVarChar, obj.kaopu_remark);
    request.addParameter('more_desc', TYPES.NVarChar, obj.ext.more_desc);


    //request.on('row',
    //    function(columns) {
    //        columns.forEach(function(column) {
    //            console.log(column.value);
    //        });
    //    });

    conn.execSql(request);
}

function executeQuery() {
    request = new Request("select top 2 * from vc_Voucher", function (err, rowCount) {
        if (err) {
            console.log(err);
        } else {
            console.log(rowCount + ' rows');
        }
    });

    request.on('row', function (columns) {
        columns.forEach(function (column) {
            console.log(column.value);
        });
    });

    connection.execSql(request);
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

function saveDataToCsv() {
    var writeStream = fs.createWriteStream(filename + ".csv", { 'encoding': 'utf8' });

    var data = "surl" +
        "," +
        ",sname" +
        "\n";


    for (var i = 0; i < jddata.length; i++) {
        data += checkCsvEmpty(jddata[i].surl) +
            "," +
            checkCsvEmpty(jddata[i].sname) +
            "\n";
        //console.log(i);
    }

    //writeStream.write(iconv.convert(data));
    writeStream.write(data);

    writeStream.close();
}

var c = new Crawler({
    rateLimit: 5000, // `maxConnections` will be forced to 1
    // maxConnections: 10,
    // This will be called for each crawled page
    callback: function (error, res, done) {
        if (error) {
            //console.log(error);
            console.log("error timeout currpage: " + currpage);
        } else {
            var $ = res.$;
            // $ is Cheerio by default
            //a lean implementation of core jQuery designed specifically for the server
            //console.log($.text());
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
                    console.log("error parse currpage: " + currpage);
                }
            }

            if (obj != null) {
                //console.log(obj);
                if (obj.data.scene_list && obj.data.scene_list.length > 0) {
                    addToSql(obj.data.scene_list);
                }
            }

            //pushJdData(obj);

            console.log(currpage + " page --------------------");

            currpage++;

            //{ "errno":0, "msg": "", "data":{ "surl":"", "sname":"", "ext":["map_x":456,"map_y":569, "map_info"], "scene_list":[{ "surl":"", "sname":"", "ext":["map_x":456,"map_y":569, "map_info", "alias":"", "en_sname":"", "address":"","phone":"",""],"cover":{"pic_url":"", "full_url":""}  }] }

            //if (currpage > maxpage) {
            //    saveDataToCsv();
            //}
        }
        done();
    }
});

// Queue just one URL, with default callback
for (var i = currpage; i <= maxpage; i++) {
    //https://lvyou.baidu.com/destination/ajax/jingdian?format=ajax&cid=0&playid=0&seasonid=5&surl=zhongguo&pn=1&rn=18
    c.queue('https://lvyou.baidu.com/destination/ajax/jingdian?format=ajax&cid=0&playid=0&seasonid=5&surl=' +
        filename +
        '&pn=' +
        i +
        '&rn=18');
}


