const http = require("http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: './config.env' });

const headers = require('./headers');
const { successHandle, errorHandle} = require('./handles');
const Todo = require('./models/todo');

const DB = process.env.DATABASE.replace('<password>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB).then(()=>{
  console.log("資料庫連線成功")
})

const requestListener = async(req, res) => {
  let body = '';
  req.on('data', (chunk)=>{
    body+=chunk;
  })

  if (req.url === '/todos' && req.method === 'GET'){
    try{
      const todos = await Todo.find();
      successHandle(res, todos)
    }catch{
      errorHandle(res, '取得資料失敗');
    }
  }else if (req.url === '/todos' && req.method === 'POST') {
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const newTodo = await Todo.create({
          title: data.title,
          done: false
        })
        successHandle(res, newTodo)
      } catch(error) {
        errorHandle(res, error.errors)
      }
    })
  }else if(req.url === '/todos' && req.method === 'DELETE'){
    await Todo.deleteMany({})
    successHandle(res, '刪除所有資料成功')
  }else if(req.url.startsWith('/todos/') && req.method === 'DELETE'){
    try{
      const toDoId = req.url.split('/').pop();
      await Todo.findByIdAndDelete(toDoId);
      successHandle(res, '刪除資料成功')
    }catch{
      errorHandle(res, '刪除資料失敗，無此ID');
    }
  }else if(req.url.startsWith('/todos/') && req.method === 'PATCH'){
    req.on('end', async()=>{
      try{
        const toDoId = req.url.split('/').pop();
        const data = JSON.parse(body);
        await Todo.findByIdAndUpdate(toDoId, {
          title: data.title
        });
        successHandle(res, '修改資料成功')
      }catch{
        errorHandle(res, '修改資料失敗，欄位名稱不正確或無此ID')
      }
    })
  }else if(req.url.startsWith('/todos') && req.method === 'OPTIONS'){
    successHandle(res, 'OPTIONS');
  }else{
    res.writeHead(404, headers);
    res.write(JSON.stringify({
      status: 'false',
      data: '無此葉面'
    }));
    res.end();
  }
}

http.createServer(requestListener).listen(process.env.PORT);