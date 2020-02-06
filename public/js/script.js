
       
       var pBank = document.getElementById("cOption1");
        pBank.addEventListener( "click",  pChartTypeChanged);
        var cg = '<%= JSON.stringify(pbank[0].BALANCE) %>'
        console.log( cg   ) 

        var fBank = document.getElementById("cOption2");
        fBank.addEventListener( "click",  fChartTypeChanged);        

        var chart = new CanvasJS.Chart("chartContainer", {
            animationEnabled: true,
            backgroundColor: "#1b2a47",
            legend:{
                itemclick: explodePie,
                fontColor: "white"
            },
            data: [{
                //chart.options.data[0].dataPoints[0] ={ y: 1, name: "Used" }
                type: "pie",
                showInLegend: true,
                indexLabelFontColor: "white",
                toolTipContent: "{name}: <strong>{y}%</strong>",
                indexLabel: "{name}: {y}%",
                dataPoints: [
                    { y: (('<%= JSON.stringify(pbank[0].ACCUMULATEDUSAGE) %>')/(1024*1024*1024)), name: "Used" },
                    { y: (('<%= JSON.stringify(pbank[0].BALANCE) %>')/(1024*1024*1024)), name: "Available"}
                ]
            }]
        });
        chart.render();
    
    function explodePie (e) {
        if(typeof (e.dataSeries.dataPoints[e.dataPointIndex].exploded) === "undefined" || !e.dataSeries.dataPoints[e.dataPointIndex].exploded) {
            e.dataSeries.dataPoints[e.dataPointIndex].exploded = true;
        } else {
            e.dataSeries.dataPoints[e.dataPointIndex].exploded = false;
        }
        e.chart.render();
    
    }
    
    function pChartTypeChanged() {
        
        chart.options.data[0].dataPoints[1] ={ y: 1, name: "Available" } ;
        chart.options.data[0].dataPoints[0] ={ y: 1, name: "Used" } ;
        chart.render();
    }

    function fChartTypeChanged() {
        
        chart.options.data[0].dataPoints[1 ] ={ y: 2, name: "Available" } ;
        chart.options.data[0].dataPoints[0] ={ y: 3, name: "Used" } ;
        chart.render();
    }