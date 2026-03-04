let goldUSD = 0;
let usdCNY = 0;

// 获取国际金价和美元兑人民币
async function fetchPrices() {
  try {
    let goldRes = await fetch('https://api.metals.live/v1/spot'); 
    let goldData = await goldRes.json();
    goldUSD = goldData[0].gold;
    
    let rateRes = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=CNY');
    let rateData = await rateRes.json();
    usdCNY = rateData.rates.CNY;

    document.getElementById('gold-usd').innerText = goldUSD.toFixed(2);
    document.getElementById('gold-cny').innerText = (goldUSD * usdCNY / 31.1035).toFixed(2);
  } catch (e) { console.error('价格获取失败', e); }
}
fetchPrices();
setInterval(fetchPrices, 30000);

// 图表
const ctx = document.getElementById('goldChart').getContext('2d');
let goldChart = new Chart(ctx, {
  type: 'line',
  data: { labels: [], datasets: [{ label: '人民币/克', data: [], borderColor: 'gold', backgroundColor: 'rgba(255, 215, 0,0.2)', tension: 0.3 }] },
  options: { responsive: true }
});
let prices = [];
for (let i=0;i<24;i++){
  prices.push((50+Math.random()*5).toFixed(2));
  goldChart.data.labels.push(`${i}h`);
  goldChart.data.datasets[0].data.push(prices[i]);
}
goldChart.update();

// 持仓计算
document.getElementById('calculate').addEventListener('click',()=>{
  const grams=parseFloat(document.getElementById('holding-grams').value);
  const currentPrice=goldUSD*usdCNY/31.1035;
  if(!isNaN(grams)){
    document.getElementById('total-value').innerText=(grams*currentPrice).toFixed(2);
  }
});

// 交易记录
let records = JSON.parse(localStorage.getItem('tradeRecords')||'[]');
function renderRecords(){
  const list=document.getElementById('records-list');
  list.innerHTML='';
  records.forEach(r=>{
    let li=document.createElement('li');
    li.textContent=`${r.type} ${r.grams}克 @ ${r.price}元/克`;
    list.appendChild(li);
  });
}
renderRecords();
document.getElementById('add-trade').addEventListener('click',()=>{
  let type=prompt('买入或卖出？');
  let grams=prompt('克数？');
  let price=prompt('价格（元/克）？');
  records.push({type,grams,price});
  localStorage.setItem('tradeRecords',JSON.stringify(records));
  renderRecords();
});

// 价格提醒
let alertPrice=null;
document.getElementById('set-alert').addEventListener('click',()=>{
  alertPrice=parseFloat(document.getElementById('alert-price').value);
  alert('提醒设置成功');
});
setInterval(()=>{
  if(alertPrice){
    let current=goldUSD*usdCNY/31.1035;
    if(current>=alertPrice){
      alert(`金价已到达 ${alertPrice} 元/克`);
      alertPrice=null;
    }
  }
},15000);