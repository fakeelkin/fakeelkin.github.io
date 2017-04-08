const DEFAULT_COLOR = "#fff";
const HEAD_COLOR = "#f82220";
const TAIL_COLOR = "#c2003c";
const CHILD_COLOR = "#f96e37";
const POINT_COLOR = "#39e2c4";
const DEATH_COLOR = "#fff";
const G_COLOR = "#fcf13a";
const S_COLOR = "#c3fc3a";
const COLOR_1 = "#fc3a9e";
const T_COLOR = "#3a5afc";
const M_COLOR = "#fc5f3a";
const FONT_COLOR = "#000";
const S_EFFECT_COLOR_1 = "rgba(252, 120, 58, 0.7)";
const S_EFFECT_COLOR_2 = "#ec6319";
const G_EFFECT_COLOR_1 = "rgba(252, 219, 162, 0.6)";
const G_EFFECT_COLOR_2 = "rgba(252, 145, 58, 0)";

/*function suportsLocalStorage() {
    if (("localStorage" in window) && (null !== window.localStorage))
        return true;
    else return false;
}*/

class Point {
    constructor(a, b) {
        this.position = {
            x: a,
            y: b
        }
    }

    distanceTo(c) {
        let a = c.x - this.position.x;
        let b = c.y - this.position.y;
        return Math.sqrt(a * a + b * b);
  }

    clonePosition() {
        return {
            x: this.position.x,
            y: this.position.y
          }
    }
}

class Region {//крч, если убрать - то от хвоста остаются следы
  constructor() {
      this.top = this.left = 999999;
      this.bottom = this.right = 0
  }

  inflate(a, b) {
      this.left = Math.min(this.left, a);
      this.top = Math.min(this.top, b);
      this.right = Math.max(this.right, a);
      this.bottom = Math.max(this.bottom, b);
  };

  expand(a, b) {
      this.left -= a;
      this.top -= b;
      this.right += 2 * a;
      this.bottom += 2 * b;
  };

  toRectangle() {
      return {
          x: this.left,
          y: this.top,
          width: this.right - this.left,
          height: this.bottom - this.top
      }
  };

}

var ElkinsWorld = new function() {
    let ag = 0;//говнопеременная
    const lives = 3;//ia
    const gravity_distance = 120;
    const pills_types = ["shield", "life", "gravitywarp", "timewarp", "sizewarp"];//для рандомного выпадения плюх
    const ig = { //дефолтные параметры //?
            x: 0,
            y: 0,
            width: 1000,
            height: 600
        };
    let world;let game;let level_selector;let start_button;let reset_button = null;
    let last_results = {
            message: "",
            progress: 0,
            target: 0
        };
    let balls = [];
    let pills = [];
    let splash = [];
    let pill_points = [];
    let obj_prop = null;//?
    let Eg = window.innerWidth - ig.width;//?
    let Fg = window.innerHeight - ig.height;//?
    let to_start = false;//s
    let score = 0;
    let start_time = 0;//Q
    let Ig = 0;//?
    let Wg = [];//?
    let cur_level = 1;//r
    let levels_prop = [{ //параметры уровней
            factor: 1.2, //скорость
            duration: 300, //продолжительность по времени
            multiplier: 0.5 //на сколько увелисиваются очки
        }, {
            factor: 1.4,
            duration: 400,
            multiplier: 0.6
        }, {
            factor: 1.6,
            duration: 500,
            multiplier: 0.7
        }, {
            factor: 1.8,
            duration: 600,
            multiplier: 0.8
        }, {
            factor: 2,
            duration: 700,
            multiplier: 1
        }, {
            factor: 2.4,
            duration: 800,
            multiplier: 1.1
        }, {
            factor: 2.9,
            duration: 1000,
            multiplier: 1.3
        }, {
            factor: 3.5,
            duration: 1300,
            multiplier: 1.7
        }, {
            factor: 4.8,
            duration: 2E3,
            multiplier: 2
        }];
        let level_stat = {
            unlockedLevels: 1,
            selectedLevel: 1,
            mute: false
        };
        let fall_dir= {//направление "ветра"
            x: 0,
            y: 1
        };
        //let da = 10000;//?
        //let ea = 0;//?
        //let ha = (new Date).getTime();//?
        //let ga = 0;//?
        //let fa = [];//очередная глобальная мусорка?

    /*function save_to_loc() { //сохранение в локал
        if(suportsLocalStorage()==true){
            localStorage.unlockedLevels = level_stat.unlockedLevels;
            localStorage.selectedLevel = level_stat.selectedLevel;
            localStorage.mute = level_stat.mute;
        }
    }*/

    function click_reset() {
        /*if(suportsLocalStorage()==true){
            localStorage.unlockedLevels = null;
            localStorage.selectedLevel = null;
            level_stat.unlockedLevels = 1;
            cur_level = level_stat.selectedLevel = 1;//!
        }*/
        reset_level_status();
        event.preventDefault();
        alert("Game history was reset.");
    }

    function click_start(a) {
        if (false == to_start){
          to_start = true;
          balls = []; pills = []; ag = Ig = score = 0;
          cur_level = level_stat.selectedLevel;
          obj_prop.trail = [];
          obj_prop.position.x = Eg;
          obj_prop.position.y = Fg;
          obj_prop.shield = 0;
          obj_prop.gravity = 0;
          obj_prop.flicker = 0;
          obj_prop.lives = lives-1;
          obj_prop.timewarped = false;
          obj_prop.timefactor = 0;
          obj_prop.sizewarped = false;
          obj_prop.sizefactor = 0;
          obj_prop.gravitywarped = false;
          obj_prop.gravityfactor = 0;
          start_button.style.display = "none";
          game_status.style.display = "block";
          start_time = (new Date).getTime();
          level_selector.style.right = "9px";
          level_selector.style.top = "0px";
          world.style.cursor= "default"/*"none"*/;//кастыль
        }
        a.preventDefault();
    }

    function death() {//после смерти
        to_start = false;
        start_button.style.display = "block";
        world.style.cursor= "default";
        score = Math.round(score);
        let scoreText = "<span>Last results:</span>";
        scoreText += " Score <span>" + Math.round(score) + "</span>";
        scoreText += " Time <span>" + Math.round(100 * (((new Date).getTime() - start_time) / 1000)) / 100 + "s</span>";
        game_status.innerHTML = scoreText;
    }

    function reset_level_status() {
        let a = level_selector.getElementsByTagName("li");
        let c;
        for (let i = 0; i < a.length; i++) {
            c = i >= level_stat.unlockedLevels ? "locked" : "unlocked";
            if (i + 1 == level_stat.selectedLevel)
                c = "selected";
            a[i].setAttribute("class", c);
        }
    }

    function setect_level(a) {
        if ("unlocked" == a.target.getAttribute("class")){
            level_stat.selectedLevel = parseInt(a.target.getAttribute("data-level"));
            cur_level = level_stat.selectedLevel;
            reset_level_status();
            //save_to_loc();
        }
        a.preventDefault();
    }

    function mouse_move(a) {
        Eg = a.clientX - 0.5 * (window.innerWidth - ig.width) - 6;
        Fg = a.clientY - 0.55 * (window.innerHeight - ig.height) - 6;
    }

    function touch_start(a) {
        if (1 == a.touches.length){
            a.preventDefault();
            Eg = a.touches[0].pageX - 0.5 * (window.innerWidth - ig.width);
            Fg = a.touches[0].pageY - 0.5 * (window.innerHeight - ig.height);
        }
    }

    function touch_move(a) {
        if (1 == a.touches.length){
            a.preventDefault();
            Eg = a.touches[0].pageX - 0.5 * (window.innerWidth - ig.width) - 60;
            Fg = a.touches[0].pageY - 0.5 * (window.innerHeight - ig.height) - 30;
        }
    }

    function set_world_size() {
        world.width = ig.width;
        world.height = ig.height;
        //Math.max(0.5 * (window.innerHeight - ig.height), 5);
    }

    function L(a, b, g) {
        g = g || 1;
        for (g = 10 * g + Math.random() * 15 * g; 0 <= --g;) {
            let c = new Point;
            c.position.x = a.x + Math.sin(g) * b;
            c.position.y = a.y + Math.cos(g) * b;
            c.velocity = {
                x: -4 + 8 * Math.random(),
                y: -4 + 8 * Math.random()
            };
            c.alpha = 1;
            splash.push(c);
        }
    }

    function clean_tail_track(a, b, c, i) {
        Wg.push({
            x: a,
            y: b,
            width: c,
            height: i
        })
    }

    function clean_balls_track(a, b, c) {
        clean_tail_track(a - c, b - c, 2 * c, 2 * c);
    }

    function update() {
      let obj;
      console.log("update");
        for (let i = Wg.length; i--;) {
            game.clearRect(Math.floor(Wg[i].x), Math.floor(Wg[i].y), Math.ceil(Wg[i].width), Math.ceil(Wg[i].height))
        }
        Wg = [];
        //let h = (new Date).getTime();
        /*ga++;
        if (h > ha + 1000){
            da = Math.min(da, Math.min(Math.round(1000 * ga / (h - ha)), 60));
            ea = Math.max(ea, Math.min(Math.round(1000 * ga / (h - ha)), 60));
            ha = h;
            ga = 0;
        }*/
        let hu = levels_prop[cur_level - 1].factor;
        if((cur_level < levels_prop.length) && to_start == true)
            hu += Ig / levels_prop[cur_level - 1].duration * (levels_prop[cur_level].factor - levels_prop[cur_level - 1].factor);
        let x_fall_coeff = fall_dir.x * hu * (1 - obj_prop.timefactor);
        let y_fall_coeff = fall_dir.y * hu * (1 - obj_prop.timefactor);
        let du, ju, fu;
        ju = 1 == obj_prop.flicker % 4 || 2 == obj_prop.flicker % 4;
        if (to_start) {
            pp = obj_prop.clonePosition();
            obj_prop.position.x += (Eg - obj_prop.position.x) / 4;
            obj_prop.position.y += (Fg - obj_prop.position.y) / 4;
            score += 0.4 * hu;
            score += 0.1 * obj_prop.distanceTo(pp);
            ag++;
            obj_prop.flicker = Math.max(obj_prop.flicker - 1, 0);
            obj_prop.shield = Math.max(obj_prop.shield - 1, 0);
            obj_prop.gravity = Math.max(obj_prop.gravity - 0.35, 0);
            //obj_prop.timewarped ? (0.5999 < obj_prop.timefactor && (obj_prop.timewarped = false), obj_prop.timefactor += 0.1 * (0.6 - obj_prop.timefactor)) : obj_prop.timefactor += 0.002 * (0 - obj_prop.timefactor);
            if(obj_prop.timewarped){
                if (0.5999 < obj_prop.timefactor)
                    obj_prop.timewarped = false;
                  obj_prop.timefactor += 0.1 * (0.6 - obj_prop.timefactor);
            }
            else obj_prop.timefactor += 0.002 * (0 - obj_prop.timefactor);
            obj_prop.timefactor = Math.max(Math.min(obj_prop.timefactor, 1), 0);
            //obj_prop.sizewarped ? (0.5999 < obj_prop.sizefactor && (obj_prop.sizewarped = false), obj_prop.sizefactor += 0.04 * (0.6 - obj_prop.sizefactor)) : obj_prop.sizefactor += 0.01 * (0 - obj_prop.sizefactor);
            if(obj_prop.sizewarped){
                if(0.5999 < obj_prop.sizefactor){
                    obj_prop.sizewarped = false;
                }
                obj_prop.sizefactor += 0.04 * (0.6 - obj_prop.sizefactor);
            }
            else obj_prop.sizefactor += 0.01 * (0 - obj_prop.sizefactor);
            obj_prop.sizefactor = Math.max(Math.min(obj_prop.sizefactor, 1), 0);
            //obj_prop.gravitywarped ? (0.99995 < obj_prop.gravityfactor && (obj_prop.gravitywarped = false), obj_prop.gravityfactor += 0.04 * (1 - obj_prop.gravityfactor)) : (0.12 > obj_prop.gravityfactor && (obj_prop.gravityfactor = 0), obj_prop.gravityfactor += 0.014 * (0 - obj_prop.gravityfactor));
            if(obj_prop.gravitywarped){
                if(0.99995 < obj_prop.gravityfactor)
                    obj_prop.gravitywarped = false;
                obj_prop.gravityfactor += 0.04 * (1 - obj_prop.gravityfactor);
            }
            else {
                if(0.12 > obj_prop.gravityfactor)
                    obj_prop.gravityfactor = 0;
                obj_prop.gravityfactor += 0.014 * (0 - obj_prop.gravityfactor);
            }
            obj_prop.gravityfactor = Math.max(Math.min(obj_prop.gravityfactor, 1), 0);
            if (0 < obj_prop.shield && (100 < obj_prop.shield || 0 != obj_prop.shield % 3)){
                du = obj_prop.size * (Math.min(obj_prop.shield, 100) / 50);
                game.beginPath();
                game.fillStyle = S_EFFECT_COLOR_1;
                game.strokeStyle = S_EFFECT_COLOR_2;
                game.arc(obj_prop.position.x,obj_prop.position.y, du, 0, 2 * Math.PI, true);
                game.fill();
                game.stroke();
                clean_balls_track(obj_prop.position.x, obj_prop.position.y, du + 2);
            }
            if(0 < obj_prop.gravityfactor){
                fu = obj_prop.gravityfactor * gravity_distance;
                du = game.createRadialGradient(obj_prop.position.x, obj_prop.position.y, 0, obj_prop.position.x, obj_prop.position.y, fu);
                du.addColorStop(0.1, G_EFFECT_COLOR_1);
                du.addColorStop(0.8, G_EFFECT_COLOR_2);
                game.beginPath();
                game.fillStyle = du;
                game.arc(obj_prop.position.x, obj_prop.position.y, fu, 0, 2 * Math.PI, true);
                game.fill();
                clean_balls_track(obj_prop.position.x, obj_prop.position.y, fu);
            }
            for (; 60 > obj_prop.trail.length - 1;)
                obj_prop.trail.push(new Point(obj_prop.position.x, obj_prop.position.y));
            game.beginPath();
            game.strokeStyle = ju ? "#333333" : TAIL_COLOR;
            game.lineWidth = 3;//толщина хвостика
            let region = new Region;
            du = 0;
            for (fu = obj_prop.trail.length; du < fu; du++){
                obj = obj_prop.trail[du];//trail
                /*0 == du ? game.moveTo(obj.position.x, obj.position.y) : obj_prop.trail[du + 1] && game.quadraticCurveTo(obj.position.x, obj.position.y, obj.position.x + (obj_prop.trail[du + 1].position.x - obj.position.x) / 2, obj.position.y + (obj_prop.trail[du + 1].position.y - obj.position.y) / 2),
                region.inflate(obj.position.x, obj.position.y), obj.position.x += x_fall_coeff, obj.position.y += y_fall_coeff;*/
                if(0 == du)
                    game.moveTo(obj.position.x, obj.position.y);
                if (obj_prop.trail[du + 1]) {
                    game.quadraticCurveTo(obj.position.x, obj.position.y, obj.position.x + (obj_prop.trail[du + 1].position.x - obj.position.x) / 2, obj.position.y + (obj_prop.trail[du + 1].position.y - obj.position.y) / 2);
                    region.inflate(obj.position.x, obj.position.y);
                    obj.position.x += x_fall_coeff;
                    obj.position.y += y_fall_coeff;
                }
            }
            region.expand(10, 10);
            du = region.toRectangle();
            clean_tail_track(du.x, du.y, du.width, du.height);
            game.stroke();
            game.closePath();
            fu = 0;
            for (du = obj_prop.trail.length - 1; 0 < du; du--) {
                obj = obj_prop.trail[du];
                if (du == Math.round(51) || du == Math.round(45) || du == Math.round(39)){
                    game.beginPath();
                    game.lineWidth = 0.5;
                    game.fillStyle = ju ? DEATH_COLOR : CHILD_COLOR;
                    game.arc(obj.position.x, obj.position.y, 2.5, 0, 2 * Math.PI, true);
                    game.fill();
                    clean_balls_track(obj.position.x, obj.position.y, 8);
                    fu++;
                }
                if (fu == obj_prop.lives) break;
            }
            if (60 < obj_prop.trail.length) obj_prop.trail.shift();
            game.beginPath();
            game.fillStyle = ju ? DEATH_COLOR : HEAD_COLOR;
            game.arc(obj_prop.position.x, obj_prop.position.y, obj_prop.size / 2, 0, 2 * Math.PI, true);
            game.fill();
            clean_balls_track(obj_prop.position.x, obj_prop.position.y, obj_prop.size + 6);
        }
        if (to_start && (0 > obj_prop.position.x || obj_prop.position.x > ig.width || 0 > obj_prop.position.y || obj_prop.position.y > ig.height)){//выход за пределы
            L(obj_prop.position, 10);
            death();
        }
        for (du = 0; du < balls.length; du++) {
            obj = balls[du];
            obj.size = obj.originalSize * (1 - obj_prop.sizefactor);
            obj.offset.x *= 0.95;
            obj.offset.y *= 0.95;
            ju = obj.distanceTo(obj_prop.position);
            if (to_start)
                if (0 < obj_prop.gravityfactor) {
                    let q = Math.atan2(obj.position.y - obj_prop.position.y, obj.position.x - obj_prop.position.x);
                    fu = obj_prop.gravityfactor * gravity_distance;
                    if(ju < fu) {
                        obj.offset.x += 0.2 * (Math.cos(q) * (fu - ju) - obj.offset.x);
                        obj.offset.y += 0.2 * (Math.sin(q) * (fu - ju) - obj.offset.y);
                    }
                }else
                    if (0 < obj_prop.shield && ju < 0.5 * (4 * obj_prop.size + obj.size)) {
                        L(obj.position, 10);
                        balls.splice(du, 1);
                        du--;
                        score += 20;
                        push_pill_points(Math.ceil(20), obj.clonePosition(), obj.force);
                        continue
                    } else
                          if (ju < 0.5 * (obj_prop.size + obj.size) && 0 == obj_prop.flicker){
                              if (0 < obj_prop.lives){
                                  L(obj_prop.position, 4);
                                  obj_prop.lives--;
                                  obj_prop.flicker += 60;
                                  balls.splice(du, 1);
                                  du--;
                              }
                              else {
                                  L(obj_prop.position, 10);
                                  death();
                              }
                          }
            game.beginPath();
            game.fillStyle = POINT_COLOR;
            game.arc(obj.position.x + obj.offset.x, obj.position.y + obj.offset.y, obj.size / 2, 0, 2 * Math.PI, true);//форма поинта
            game.fill();
            clean_balls_track(obj.position.x + obj.offset.x, obj.position.y + obj.offset.y, obj.size);
            obj.position.x += x_fall_coeff * obj.force;//направление движения точек
            obj.position.y += y_fall_coeff * obj.force;
            if (obj.position.x < -obj.size || obj.position.y > ig.height + obj.size){
                balls.splice(du, 1);
                du--;
                if(to_start) Ig++;
            }
        }
        for (du = 0; du < pills.length; du++) {
            obj = pills[du];
            if (obj.distanceTo(obj_prop.position) < 0.5 * (obj_prop.size + obj.size) && to_start) {
                if (obj.type == "shield")
                    obj_prop.shield = 300;
                else
                    if(obj.type == "life"){
                        if(obj_prop.lives < lives){//чтобы жизней не было больше 3х
                            push_pill_points("+1HP", obj.clonePosition(), obj.force);
                            obj_prop.lives = Math.min(obj_prop.lives + 1, lives);
                        }
                    }
                    else
                        if(obj.type == "gravitywarp")
                            obj_prop.gravitywarped = true;
                        else
                            if (obj.type == "timewarp")
                                obj_prop.timewarped = true;
                            else
                                if (obj.type == "sizewarp")
                                    obj_prop.sizewarped = true;

                if(obj.type != "life"){
                    score += 50;
                    push_pill_points(Math.ceil(50), obj.clonePosition(), obj.force);
                }
                for (ju = 0; ju < balls.length; ju++) {
                    e = balls[ju];
                    if(100 > e.distanceTo(obj.position)){ //в каком радиусе умирают шарики
                        L(e.position, 10);
                        balls.splice(ju, 1);
                        ju--;
                        score += 20;
                        push_pill_points(Math.ceil(20), e.clonePosition(), e.force);
                    }
                }
                pills.splice(du, 1);
                du--;
            } else
                if (obj.position.x < -obj.size || obj.position.y > ig.height + obj.size){
                    pills.splice(du, 1);
                    du--;
                }
            ju = "";
            fu = DEFAULT_COLOR;
            if(obj.type === "shield"){
                ju = "S";
                fu = S_COLOR;
            }
            else
                if (obj.type === "life"){
                    ju = "1";
                    fu = COLOR_1;
                }
                else
                    if(obj.type === "gravitywarp"){
                        ju = "G";
                        fu = G_COLOR;
                    }
                    else
                        if (obj.type === "timewarp"){
                            ju = "T";
                            fu = T_COLOR;
                        }
                        else
                            if(obj.type === "sizewarp"){
                                ju = "M";
                                fu = M_COLOR;
                            }
            game.beginPath();
            game.fillStyle = fu;
            game.arc(obj.position.x, obj.position.y, obj.size / 2, 0, 2 * Math.PI, true);
            game.fill();
            game.save();
            game.font = "bold 12px Arial";
            game.fillStyle = FONT_COLOR;
            game.fillText(ju, obj.position.x - 0.5 * game.measureText(ju).width, obj.position.y + 4);
            game.restore();
            clean_balls_track(obj.position.x, obj.position.y, obj.size);
            obj.position.x += x_fall_coeff * obj.force;
            obj.position.y += y_fall_coeff * obj.force;
        }
        if(balls.length < 27 * hu)
            balls.push(points_coordinates(new Ball));
        if (1 > pills.length && 0.994 < Math.random() && false == obj_prop.isBoosted()) {
            for (hu = new Pill; hu.type == "life" && obj_prop.lives >= lives;)
                hu.randomizeType();
            pills.push(points_coordinates(hu))
        }
        //1 == obj_prop.shield && to_start; //что за дичь?
        for (du = 0; du < splash.length; du++){
            obj = splash[du];
            obj.velocity.x += 0.04 * (levels_prop[cur_level - 1].multiplier - obj.velocity.x);
            obj.velocity.y += 0.04 * (y_fall_coeff - obj.velocity.y);
            obj.position.x += obj.velocity.x;
            obj.position.y += obj.velocity.y;
            obj.alpha -= 0.02;
            game.fillStyle ="rgba(255,255,255," + Math.max(obj.alpha, 0) + ")";//цвет всплесков
            game.fillRect(obj.position.x, obj.position.y, 1, 1);
            clean_balls_track(obj.position.x, obj.position.y, 2);
            if (0 >= obj.alpha)
                splash.splice(du, 1);
        }
        for (du = 0; du < pill_points.length; du++){
            obj = pill_points[du];
            obj.position.x += x_fall_coeff * obj.force;
            obj.position.y = (obj.position.y + y_fall_coeff * obj.force) - 1;
            hu = game.measureText(obj.text).width;
            game.save();
            game.font = "10px Arial";
            game.fillStyle = "rgba( 255, 255, 255, " + obj.alpha + " )";//цвет очков когда съел конфетку
            game.fillText(obj.text, obj.position.x - 0.5 * hu, obj.position.y);
            game.restore();
            clean_tail_track(obj.position.x - 0.5 * hu - 5, obj.position.y - 12, hu + 8, 22);
            obj.alpha *= 0.96;
            if(0.05 > obj.alpha){
                pill_points.splice(du, 1);
                du--;
            }
        }
        if (to_start) {
            if (hu = Ig > levels_prop[cur_level - 1].duration)
                if (cur_level < levels_prop.length){
                    cur_level++;
                    Ig = 0;
                    level_stat.unlockedLevels = Math.max(level_stat.unlockedLevels, cur_level);
                    level_stat.selectedLevel = cur_level;
                    //save_to_loc();
                    reset_level_status();
                    hu = true;
                } else hu = false;
            if(hu){
                last_results.progress = 0;
                last_results.target = 1;
            }
            let scoreText = "<span>Last results:</span>";
            scoreText += " Score <span>" + Math.round(score) + "</span>";
            scoreText += " Time <span>" + Math.round(100 * (((new Date).getTime() - start_time) / 1000)) / 100 + "s</span>";
            game_status.innerHTML = scoreText;
        }
        requestAnimFrame(update);
    }

    function push_pill_points(a, b, c) {
        pill_points.push({
            text: a,
            position: {
                x: b.x,
                y: b.y
            },
            alpha: 1,
            force: c
        })
    }

    function points_coordinates(a) {
        if(0.5 < Math.random()){
            a.position.x = Math.random() * ig.width;
            a.position.y = -10;
        }
        else {
            a.position.x = ig.width + 10
            a.position.y = 0.2 * -ig.height + 1.2 * Math.random() * ig.height;
        }
        return a;
    }

    function initial_values() {
        this.position = {
            x: 0,
            y: 0
        };
        this.trail = [];
        this.size = 12;
        this.shield = 0;
        this.lives = lives-1;
        this.flicker = 0;
        this.gravitywarped = false;
        this.gravityfactor = 0;
        this.timewarped = false;
        this.timefactor = 0;
        this.sizewarped = false;
        this.sizefactor = 0
    }

    function Ball() {
        this.position = {
            x: 0,
            y: 0
        };
        this.offset = {
            x: 0,
            y: 0
        };
        this.originalSize = this.size = 10 + 4 * Math.random();
        this.force = 1.5 + 0.1 * Math.random();//скорость поинтов!!!
    }

    function Pill() {
        this.type = null;
        this.position = {
            x: 0,
            y: 0
        };
        this.size = 30 + 4 * Math.random();
        this.force = 1 + 1 * Math.random();//скорость плюшек!!!
        this.randomizeType();
    }

    this.initialize = function() {
        world = document.getElementById("world");//q
        game_status = document.getElementById("game-status");//w
        level_selector = document.getElementById("level-selector");//R
        start_button = document.getElementById("start-button");//Ea
        reset_button = document.getElementById("reset-button");//Fa
        if (world && world.getContext) {
            game = world.getContext("2d");//b
            document.addEventListener("mousemove", mouse_move, false);//Ua
            world.addEventListener("touchstart", touch_start, false);//Xa
            document.addEventListener("touchmove", touch_move, false);//Ya
            start_button.addEventListener("click", click_start, false);
            reset_button.addEventListener("click", click_reset, false);
            window.addEventListener("resize", set_world_size, false);
            /*if (suportsLocalStorage()) {
                var c = parseInt(localStorage.unlockedLevels),
                    fk = parseInt(localStorage.selectedLevel),
                    g = localStorage.mute;
                c && (level_stat.unlockedLevels = c);
                fk && (level_stat.selectedLevel = fk);
                g && (level_stat.mute = "true" == g);
            }*/
            let g = "";
            c = 1;
            for (let i = levels_prop.length; c <= i; c++)
                g += '<li data-level="' + c + '">' + c + "</li>";
            level_selector.getElementsByTagName("ul")[0].innerHTML = g;
            g = level_selector.getElementsByTagName("li");
            c = 0;
            for (let i = g.length; c < i; c++)
                g[c].addEventListener("click", setect_level, false);
            reset_level_status();
            obj_prop = new initial_values;
            set_world_size();
            //game_status.style.width = ig.width + "px";
            //world.style.border = "none";
            fall_dir.x *= 2;
            fall_dir.y *= 2;
            update();
            world.style.display = "block";
            start_button.style.display = "block";
        }
    };

    initial_values.prototype = new Point;//?
    initial_values.prototype.isBoosted = function() {
        return 0 != this.shield || 0 != this.gravityfactor;
    };
    Ball.prototype = new Point;//?
    Pill.prototype = new Point;//?
    Pill.prototype.randomizeType = function() {
        this.type = pills_types[Math.round(Math.random() * (pills_types.length - 1))];
    }
};

window.requestAnimFrame = function() {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(ag) {
        window.setTimeout(ag, 1000 / 60);
    }
}();

ElkinsWorld.initialize();
