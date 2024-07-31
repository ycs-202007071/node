// express server.js
const express = require('express');
const cors = require('cors');
const oracledb = require('oracledb');

const app = express();
app.use(cors());
app.use(express.json());

const config = {
  user: 'SYSTEM',
  password: 'test1234',
  connectString: 'localhost:1521/xe'
};

// Oracle 데이터베이스와 연결을 유지하기 위한 전역 변수
let connection;

// 데이터베이스 연결 설정
async function initializeDatabase() {
  try {
    connection = await oracledb.getConnection(config);
    console.log('Successfully connected to Oracle database');
  } catch (err) {
    console.error('Error connecting to Oracle database', err);
  }
}

initializeDatabase();

app.get('/', (req, res) => {
 res.send('Hello World'); 

});

app.post('/login', async(req, res) => {
    var{ userid, pwd} = req.body;
    var query=`SELECT COUNT(*) as CNT FROM MEMBERJOIN WHERE USERID = '${userid}' AND PWD= '${pwd}'`;
    var result = await connection.execute(query);
    const columnNames = result.metaData.map(column => column.name);
      // 쿼리 결과를 JSON 형태로 변환
      const rows = result.rows.map(row => {
        // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
        const obj = {};
        columnNames.forEach((columnName, index) => {
          obj[columnName] = row[index];
        });
        return obj;
      });
      res.json(rows);
  });

  
  app.post('/check', async(req, res) => {
    const { userid } = req.body;
    const query = `SELECT COUNT(*) as CNT FROM MEMBERJOIN WHERE USERID = :userid`;

    try {
        const result = await connection.execute(query, [userid]);
        const count = result.rows[0][0];
        res.json({ exists: count > 0 });
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).send('Error executing query');
    }
});


  app.post('/insert', async(req, res) => { //post 방식은 body에서 꺼낸다. get형식은 주소를 그대로 던지기 때문에 query
    var {userid, pwd, username, email, phone, gender} = req.body;
    var query = `INSERT INTO MEMBERJOIN VALUES ('${userid}','${pwd}','${username}','${email}','${phone}', '${gender}')`;
    await connection.execute(query, [], { autoCommit: true });
    res.json({message : "회원가입이 완료되었습니다."});
    });


// 서버 시작
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});