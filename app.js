console.log("@kris");
let x = 0;

const fun = () => {
  x++;
  console.log(`${x}`);
};

const id = setInterval(fun, 1000);

setTimeout(() => {
  clearInterval(id);
  console.log("Interval stopped");
}, 10000);
