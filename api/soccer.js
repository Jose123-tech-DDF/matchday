module.exports=async function handler(req,res){
  res.setHeader('Content-Type','application/json');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
  const input=new URL(req.url,'https://matchday.local');
  const resource=input.searchParams.get('resource')||'scoreboard';
  if(!['summary','scoreboard'].includes(resource))return res.status(400).json({error:'Invalid resource'});
  const query=new URLSearchParams();
  if(resource==='summary'){
    const event=input.searchParams.get('event')||'';
    if(!/^\d{1,20}$/.test(event))return res.status(400).json({error:'Invalid match ID'});
    query.set('event',event);
  }else{
    const dates=input.searchParams.get('dates')||'';
    if(!/^\d{8}$/.test(dates))return res.status(400).json({error:'Invalid date'});
    query.set('dates',dates);query.set('limit','100');
  }
  try{
    const upstream=await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/'+resource+'?'+query,{signal:AbortSignal.timeout(10000),headers:{Accept:'application/json'}});
    if(!upstream.ok)throw Error('Upstream unavailable');
    const data=await upstream.json();
    res.setHeader('Cache-Control','public, s-maxage=15, stale-while-revalidate=15');
    return res.status(200).json(data);
  }catch{return res.status(502).json({error:'Soccer feed unavailable. Please retry shortly.'});}
};
