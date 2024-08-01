const express = require('express');
const cors = require('cors');
const path = require('path');
const oracledb = require('oracledb');

const app = express();
app.use(cors());
app.use(express.json());    //post방식은 json으로 받는다고 선언. 위치 잘 확인하기!

// ejs 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '.')); // .은 경로

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

// 엔드포인트
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.post('/login', async(req, res) => {
  var{ id, pwd} = req.body;
  var query=`SELECT COUNT(*) as CNT FROM MEMBER WHERE ID = '${id}' AND PWD= '${pwd}'`;
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

app.get('/list', async (req, res) => {
  const { keyword, grade , orderName, orderKind} = req.query;
  try {
    const result = await connection.execute(
      `SELECT * FROM STUDENT 
      WHERE (STU_NAME LIKE '%${keyword}%' OR STU_NO LIKE '%${keyword}%') AND STU_GRADE LIKE '%${grade}%'
      ORDER BY ${orderName} ${orderKind}`);
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
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/delete', async (req, res) => {
  const { stuNo } = req.query;
  try {
    await connection.execute(
      `DELETE FROM STUDENT WHERE STU_NO IN (${stuNo})`, [], { autoCommit: true }
    );
   
    res.json([{message : "삭제되었습니다"}]);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});


app.get('/update', async (req, res) => {
  const { stuNo, stuName, stuDept, stuGrade, stuGender } = req.query;
  var query = `UPDATE STUDENT SET STU_NAME = '${stuName}', STU_DEPT = '${stuDept}', STU_GRADE = '${stuGrade}', STU_GENDER = '${stuGender}'  WHERE STU_NO = '${stuNo}'`
  try {
    await connection.execute(
      query, [], { autoCommit: true }
    );
   
    res.json([{message : "수정되었습니다."}]);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/stu-Delete', async (req, res) => {
  const { stuNo } = req.query;
  var query = `DELETE FROM STUDENT WHERE STU_NO = ${stuNo}`;
    await connection.execute(query, [], { autoCommit: true }); //async랑 await는 짝꿍이라고 생각하면 편하다.
    res.json({message : "잘 삭제되었다!"});
  });

  app.get('/check', async (req, res) => {
   const {stuNo} = req.query;
   var query = `SELECT * FROM STUDENT WHERE STU_NO = ${stuNo}`;
   await connection.execute(query, [], {autoCommit: true });
   
  });

  // app.get('/insert', async (req, res) => {
  //   const { stuNo, stuName, stuDept, stuGrade, stuGender } = req.query;
  //   var query = `INSERT INTO STUDENT (STU_NO, STU_NAME, STU_DEPT, STU_GRADE, STU_GENDER) VALUES ('${stuNo}','${stuName}','${stuDept}','${stuGrade}','${stuGender}')`;
  //     await connection.execute(query, [], { autoCommit: true }); //async랑 await는 짝꿍이라고 생각하면 편하다.
  //     res.json({message : "잘 등록되었다!!"});
  //   });

  // app.use(express.json());    //post방식은 json으로 받는다고 선언.위쪽에 선언되어있다!!!!!! 위치 잘 파악하기!!! 
    app.post('/insert', async(req, res) => { //post 방식은 body에서 꺼낸다. get형식은 주소를 그대로 던지기 때문에 query
      var {stuNo, stuName, stuDept, stuGrade, stuGender} = req.body;
      var query = `INSERT INTO STUDENT (STU_NO, STU_NAME, STU_DEPT, STU_GRADE, STU_GENDER) VALUES ('${stuNo}','${stuName}','${stuDept}','${stuGrade}','${stuGender}')`;
      await connection.execute(query, [], { autoCommit: true });
      res.json({message : "추가되었다!"});

      });

// 서버 시작
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});