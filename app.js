// ----------------- 国内免费金价接口 -----------------
let goldCNY = 0;
let goldUSD = 0;

// 历史价格记录（用于图表）
let historyData = [];
let historyLabels = [];

async function fetchPrices() {
  try {
    let res = await fetch('https://api.freejk.com/shuju/jinjia/');
    let data = await res.json();

    if(data.status === "success" && data.data) {
      goldCNY = parseFloat(data.data.price);
      goldUSD = parseFloat(data.data.international_price);

      document.getElementById('gold-cny').innerText = goldCNY.toFixed(2);
      document.getElementById('gold-usd').innerText = goldUSD.toFixed(2);

      // 更新历史数据图表
      let now = new Date().toLocaleTimeString();
      historyData.push(goldCNY);
      historyLabels.push(now);
      if(historyData.length > 24){ // 保留最近24条
        historyData.shift();
        historyLabels.shift();
      }
      goldChart.data.labels = historyLabels;
      goldChart.data.datasets[0].data = historyData;
      goldChart.update();
    } else {
      console.warn("接口未返回数据，使用上一次价格");
    }
  } catch(e) {
    console.error("获取金价失败，使用上一次价格", e);
  }
}

// 初次调用并定时刷新
fetchPrices();
setInterval(fetchPrices, 3000); // 每3秒刷新

// ----------------- 历史价格图表（Chart.js） -----------------
const ctx = document.getElementById('goldChart').getContext('2d');
let goldChart = new Chart(ctx, {
  type: 'line',
  data: { labels: [], datasets: [{ 
    label: '人民币/克', 
    data: [], 
    borderColor: 'gold', 
    backgroundColor: 'rgba(255, 215, 0,0.2)', 
    tension: 0.3 
  }] },
  options: { responsive: true }
});

// ----------------- 持仓计算 -----------------
document.getElementById('calculate').addEventListener('click',()=>{
  const grams = parseFloat(document.getElementById('holding-grams').value);
  if(!isNaN(grams)){
    document.getElementById('total-value').innerText = (grams * goldCNY).toFixed(2);
  }
});

// ----------------- 本地交易记录 -----------------
let records = JSON.parse(localStorage.getItem('tradeRecords')||'[]');

function renderRecords(){
  const list = document.getElementById('records-list');
  list.innerHTML = '';
  records.forEach(r=>{
    let li = document.createElement('li');
    li.textContent = `${r.type} ${r.grams}克 @ ${r.price}元/克`;
    list.appendChild(li);
  });
}
renderRecords();

document.getElementById('add-trade').addEventListener('click',()=>{
  let type = prompt('买入或卖出？');
  if(!type) return;
  let grams = prompt('克数？');
  let price = prompt('价格（元/克）？');
  if(type && grams && price){
    records.push({type,grams,price});
    localStorage.setItem('tradeRecords',JSON.stringify(records));
    renderRecords();
  }
});

// ----------------- 价格提醒 -----------------
let alertPrice = null;
document.getElementById('set-alert').addEventListener('click',()=>{
  alertPrice = parseFloat(document.getElementById('alert-price').value);
  alert('价格提醒设置成功');
});

setInterval(()=>{
  if(alertPrice && goldCNY >= alertPrice){
    alert(`金价已到达 ${alertPrice} 元/克`);
    alertPrice = null;
  }
},1500); // 每1.5秒检测提醒，保证及时弹出

// ----------------- 历史周期切换 -----------------
function updateChartPeriod(period){
  let base = goldCNY || 870;
  let data = [], labels = [];
  if(period === "24h"){
    data = generateHistory(24, base);
    labels = Array.from({length:24}, (_,i)=>`${i}h`);
  } else if(period === "1m"){
    data = generateHistory(30, base);
    labels = Array.from({length:30}, (_,i)=>`Day ${i+1}`);
  } else if(period === "6m"){
    data = generateHistory(6, base);
    labels = ["Month 1","Month 2","Month 3","Month 4","Month 5","Month 6"];
  } else if(period === "1y"){
    data = generateHistory(12, base);
    labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  }
  historyData = data;
  historyLabels = labels;
  goldChart.data.labels = labels;
  goldChart.data.datasets[0].data = data;
  goldChart.update();
}

function generateHistory(points, basePrice){
  let arr = [];
  for(let i=0;i<points;i++){
    arr.push((basePrice + Math.random()*5 - 2.5).toFixed(2));
  }
  return arr;
}
updateChartPeriod("24h"); // 默认显示24小时
